import * as pulumi from "@pulumi/pulumi";
import * as resources from "@pulumi/azure-native/resources";
import * as azure_native from "@pulumi/azure-native";

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
});

export const url = staticSite.contentDistributionEndpoint;
