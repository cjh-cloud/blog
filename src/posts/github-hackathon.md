---
title: "How to create a GitHub Action to run Unit Tests & perform Webhooks"
date: "2020-04-8"
---

![GitHub Hackathon](./github-hackathon.png)

[Test-Webhook - My GitHub Action](https://github.com/SenorGrande/Test-Webhook)

My GitHub Action
[GitHub ran a Hackathon last month to create and submit a GitHub Action.](https://githubhackathon.com/)
I’d never entered a Hackathon before and had been playing around with different Actions ranging from deploying to NPM, running tests, publishing a Gatsby site and deploying to AWS S3. It was time to make my own so I could better understand how they work, this article will share my learnings.

I wanted to create an Action that would run unit tests in a project, and then HTTP POST the result to a URL. In essence, it runs `NPM test` and then performs a Webhook. The action consists of the following three files:

## action.yml
This file is used to define the Action. Name, description, and branding are used by the GitHub Marketplace when displaying your Action.
“runs” defines that Docker is used for this action and to use “Dockerfile”, another file in our repo, to build an image from it.

```
name: 'NPM Test & Webhook'
description: 'Run npm tests & post result to http endpoint'
runs:  
  using: 'docker'  
  image: 'Dockerfile'
branding:
  icon: 'box'
  color: 'orange'
```

### Dockerfile
This Dockerfile uses Node as a base image and installs the Curl package so that we can perform an HTTP POST. The “entrypoint” shell script is then copied, and the executable permission is applied to it.

```
FROM node:12.16.1 # Install curl
RUN apt update && apt install -y curl # Add the entry point
ADD entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh # Load the entry point
ENTRYPOINT ["/entrypoint.sh"]
```

### entrypoint.sh
This script will run inside the Docker container, it installs the node modules, runs the build script, and then runs the test script. The output from the npm test command is then searched for failed tests. A pass or fail is then POSTed to the webhook URL that is set as a GitHub secret.
All echo commands will show up in the GitHub Action logs to make debugging easier.

```
#!/bin/bashnpm ci
npm run build --if-present
VALID=$(npm test || true)
echo $VALID
PASSING="$(echo $VALID | grep -o '[0-9] failing')" # If all tests pass, $PASSING will be empty
if [ -z "$PASSING" ]
then
  RESULTS="pass"
else
  RESULTS="fail"
fi RES=$(curl --write-out '%{http_code}' --silent --output /dev/null -X POST -H "Content-Type: application/json" --data "{ \"data\": \"$RESULTS\" }"  $WEBHOOK_URL) # If RESULTS is fail or curl returned 404, throw an error
if [ "$RES" != "200" ]
then
  echo "*** Post failed"
  exit 64
elif [ $RESULTS = "fail" ]
then
  echo "*** NPM Test failed"
  exit 64
fi
```

How to Use the GitHub Action

With our Action done, here’s an example of how to implement it to run on another GitHub project. Create a new YAML file in `.github/workflows`. (Create the directory in your repository if it doesn’t already exist. Having an “.” at the beginning makes it a hidden folder, `ls -a` will show all files and directories).

First, we use actions/checkout, this will check out the code and allow our Action to run the NPM commands successfully. We then provide the webhook URL as an environment variable which has been set as a secret on the repository.

```
name: NPM Test & Webhook
on: push

jobs:
  webhook:
    name: NPM Test & Webhook action
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v1
    - name: Run NPM Test & POST
      uses: SenorGrande/test-webhook@v1
      env:
        WEBHOOK_URL: ${{ secrets.WEBHOOK_URL }}
```

[Have a look at my simple Node server repo that I used for testing if you’re lost](https://github.com/SenorGrande/node-app)

## Using the Action to change the colour of an RGB LED

I used this Action to POST to an HTTP endpoint on my Node-RED Docker container running on my Raspberry Pi. Node-RED would then change the colour of an RGB LED to green if the tests all passed, otherwise it would change to red.
To read on how I got Node-RED and Johnny-Five working in a Docker container, check out my previous article:

[Using Johnny Five with Node-RED and Docker](https://medium.com/@hewett.j.connor/using-johnny-five-with-node-red-and-docker-98daa5b31cc)

Cheers for reading!
