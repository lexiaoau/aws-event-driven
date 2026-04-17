#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { AwsEventDrivenStack } from '../lib/aws-event-driven-stack';


const app = new cdk.App();

new AwsEventDrivenStack(app, 'AwsEventDrivenStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});
