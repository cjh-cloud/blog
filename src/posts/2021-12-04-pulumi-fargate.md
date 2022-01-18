---
title: "Deploy an ECR image to AWS Fargate with an SSL certificate and Route53 records using Pulumi"
date: "2021-12-04"
---

![Pulumi](2021-11-14-pulumi.png)

In this article we will deploy a Docker image in an existing AWS ECR repository to AWS Fargate. A load balancer will be created with an SSL certificate to route traffic to Fargate, and the appropriate DNS records will be created in an existing Route53 hosted zone to validate the SSL certificate and route traffic from the domain to the load balancer.

Look at my existing articles on how to create an ECR repo and push a Docker image to it with Pulumi. [Part 1](https://cj-hewett.medium.com/build-and-push-a-docker-image-to-aws-ecr-with-pulumi-part-1-70bc80531007), [Part 2](https://cj-hewett.medium.com/build-and-push-a-docker-image-to-aws-ecr-with-pulumi-part-2-with-azure-devops-2854df06e356), [Part 3](https://cj-hewett.medium.com/build-and-push-a-docker-image-to-aws-ecr-with-pulumi-part-3-with-azure-devops-and-semantic-cf8c06b7016e)

**Note:** You will need to setup your AWS credentials and login to ECR if you plan to run this locally. This is detailed in my previous [article](https://cj-hewett.medium.com/build-and-push-a-docker-image-to-aws-ecr-with-pulumi-part-1-70bc80531007) on how to set this up (scroll to “Login to AWS ECR registry”).
This article assumes you have also already created a Pulumi project.

[You can view the code for my project here, this is all done in **Typescript**:](https://github.com/SenorGrande/pulumi_ecr_example)

## Create the ECR repo
The following code in your `index.ts` file will create a repository in AWS ECR and the build and push an image in the `app` directory to it.

**Note:** `imageVersion` is hardcoded, check out my [article](https://cj-hewett.medium.com/build-and-push-a-docker-image-to-aws-ecr-with-pulumi-part-3-with-azure-devops-and-semantic-cf8c06b7016e) on how to automate versioning in Azure Pipelines.

```
import * as aws from "@pulumi/aws";
import * as docker from "@pulumi/docker";
import * as pulumi from "@pulumi/pulumi";

const customImage = "my-image"; // name of the pulumi resource
const imageVersion = "1.0.0";

// Create a private ECR repository.
const repo = new aws.ecr.Repository("my-repo");

// Get registry info (creds and endpoint)
const imageName = repo.repositoryUrl;

// Build and publish the container image
image = new docker.Image(customImage, {
  build: "app",
  imageName: pulumi.interpolate`${imageName}:${imageVersion}`,
});

// Export the base and specific version image name.
export const baseImageName = image.baseImageName;
export const fullImageName = image.imageName;
```

## Create the rest of the infrastructure…
We will now create the rest of the infrastructure to get our app running and accessible with a custom URL.

Import the Pulumi Crosswalk for AWS package. This will make it easy to create a VPC, Load Balancer, and Fargate cluster with minimal configuration on our end.

Create a variable for your domain you want your app to be hosted on, and the port that the container uses. For example, my Node.js script listens to port `8080` while running inside a Docker container.

```
//* Deploy the image to Fargate...
import * as awsx from "@pulumi/awsx";

const DOMAIN = 'example.com';
const PORT = 8080;
```

### Create a VPC
We will create a new VPC for our Load Balancer and Fargate Cluster as it is best practice to avoid using the default VPC.

```
// Allocate a new VPC with the default settings:
const vpc = new awsx.ec2.Vpc("custom", {});

// Export a few resulting fields to make them easy to use:
export const vpcId = vpc.id;
export const vpcPrivateSubnetIds = vpc.privateSubnetIds;
export const vpcPublicSubnetIds = vpc.publicSubnetIds;
```

### Create SSL cert and DNS records
We will create an SSL certificate with AWS ACM and verify it by creating the necessary DNS records in an existing Route53 Hosted Zone.
I’m adding the subdomain `dev` to my domain, because I already have something else using the root domain.

```
// SSL Certificate
const exampleCertificate = new aws.acm.Certificate("cert", {
  domainName: `dev.${DOMAIN}`,
  tags: {
    Environment: "dev",
  },
  validationMethod: "DNS",
});

const hostedZoneId = aws.route53.getZone({ name: DOMAIN }, { async: true }).then(zone => zone.zoneId);

// DNS records to verify SSL Certificate
const certificateValidationDomain = new aws.route53.Record(`dev.${DOMAIN}-validation`, {
  name: exampleCertificate.domainValidationOptions[0].resourceRecordName,
  zoneId: hostedZoneId,
  type: exampleCertificate.domainValidationOptions[0].resourceRecordType,
  records: [exampleCertificate.domainValidationOptions[0].resourceRecordValue],
  ttl: 600,
});

const certificateValidation = new aws.acm.CertificateValidation("certificateValidation", {
  certificateArn: exampleCertificate.arn,
  validationRecordFqdns: [certificateValidationDomain.fqdn],
});
```

### Create load balancer
The next step is to:
- Create an Application Load Balancer within the VPC we created earlier
- Create a listener on the ALB that redirects requests to port `80` to port `443` . This is so that HTTP requests automatically get redirected to HTTPS.
- Create a Target Group on the ALB that listens to the same port the app inside the Docker image uses (in my case port `8080`).
- Create a listener on the Target Group (not the ALB like before) that listens to port `443` and uses the SSL certificate we created.
- Create the DNS record in the Route53 Hosted Zone for the ALB endpoint.

```
// Creates an ALB associated with our custom VPC.
const alb = new awsx.lb.ApplicationLoadBalancer(
  `${customImage}-service`, { vpc }
);

// Listen to HTTP traffic on port 80 and redirect to 443
const httpListener = alb.createListener("web-listener", {
  port: 80,
  protocol: "HTTP",
  defaultAction: {
    type: "redirect",
    redirect: {
      protocol: "HTTPS",
      port: "443",
      statusCode: "HTTP_301",
    },
  },
});

// Target group with the port of the Docker image
const target = alb.createTargetGroup(
  "web-target", { vpc, port: PORT }
);

// Listen to traffic on port 443 & route it through the target group
const httpsListener = target.createListener("web-listener", {
  port: 443,
  certificateArn: certificateValidation.certificateArn
});

// Create a DNS record for the load balancer
const albDomain = new aws.route53.Record(`dev.${DOMAIN}`, {
  name: `dev.${DOMAIN}`,
  zoneId: hostedZoneId,
  type: "CNAME",
  records: [httpsListener.endpoint.hostname],
  ttl: 600,
});
```

### Create the Fargate Cluster and Service
Now we will:
- Create a Fargate Cluster in the VPC
- Create the Fargate Service within our cluster with 1 task/container running. The Task Definition will use the image we push to ECR, and use the same port the Target Group is routing traffic to, 8080.

```
// Fargate Cluster
const cluster = new awsx.ecs.Cluster(`${customImage}-cluster`, { vpc });

const service = new awsx.ecs.FargateService(`${customImage}-service`, {
  cluster,
  desiredCount: 1,
  taskDefinitionArgs: {
    containers: {
      app: {
        image: pulumi.interpolate`${imageName}:${imageVersion}`,
        memory: 512,
        portMappings: [httpsListener],
      },
    },
  },
});

// Export the URL so we can easily access it.
export const frontendURL = pulumi.interpolate `https://dev.${DOMAIN}/`;
```

### Run `pulumi up` and you’re done!
Visit your URL in the browser and it should respond with your app.
Run pulumi destroy to remove all the resources created, once you’re done.

Hope this helped,

Bonza 🤙
