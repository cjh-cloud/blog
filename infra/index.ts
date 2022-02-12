import * as pulumi from "@pulumi/pulumi";
import * as resources from "@pulumi/azure-native/resources";
import * as azure_native from "@pulumi/azure-native";
import * as aws from "@pulumi/aws";

const config = new pulumi.Config();

// Create an Azure Resource Group
const resourceGroup = new resources.ResourceGroup("blog");

const staticSite = new azure_native.web.StaticSite("staticSite", {
    branch: "main",
    location: "WestUS2",
    name: "blog",
    repositoryUrl: "https://github.com/SenorGrande/senorgrande.github.io",
    repositoryToken: config.require("gh_token"),
    resourceGroupName: resourceGroup.name,
    sku: {
        name: "Free",
        tier: "Free",
    },
});

const staticSiteCustomDomain = new azure_native.web.StaticSiteCustomDomain("staticSiteCustomDomain", {
    domainName: "cjscloud.city",
    name: staticSite.name,
    resourceGroupName: resourceGroup.name,
    validationMethod: 'dns-txt-token'
});

// AWS S3 bucket for redirection
// Create an AWS resource (S3 Bucket)
const bucket = new aws.s3.Bucket("cjscloud.city", {
    bucket: "cjscloud.city",
    website: {
        redirectAllRequestsTo: "www.cjscloud.city"
    },
});

// todo : add records to hostzone route53
const selected = aws.route53.getZone({
    name: "cjscloud.city.",
    privateZone: false,
});
const www = new aws.route53.Record("www", {
    zoneId: selected.then((selected: { zoneId: any; }) => selected.zoneId),
    name: selected.then((selected: { name: any; }) => `www.${selected.name}`),
    type: "CNAME",
    ttl: 300,
    records: [staticSite.defaultHostname],
});
const apex = new aws.route53.Record("apex", {
    zoneId: selected.then((selected: { zoneId: any; }) => selected.zoneId),
    name: selected.then((selected: { name: any; }) => `${selected.name}`),
    type: "A",
    aliases: [{
        name: "s3-website-ap-southeast-2.amazonaws.com",
        zoneId: "Z1WCIGYICN2BYD", // https://docs.aws.amazon.com/general/latest/gr/s3.html#s3_website_region_endpoints
        evaluateTargetHealth: false,
    }],
});

export const url = staticSite.customDomains;
