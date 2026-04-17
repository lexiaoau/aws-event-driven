import {
  Stack,
  StackProps,
  Duration,
  aws_dynamodb as dynamodb,
  aws_lambda as lambda,
  aws_sns as sns,
  aws_sns_subscriptions as subs,
  aws_iam as iam,
  aws_pipes as pipes,
} from 'aws-cdk-lib';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs'; // 新增 import
import { Construct } from 'constructs';

export class AwsEventDrivenStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // 1. DynamoDB 表（带 Streams）
    const patientTable = new dynamodb.Table(this, 'PatientQueueTable', {
      partitionKey: { name: 'patientId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'queueId', type: dynamodb.AttributeType.STRING },
      stream: dynamodb.StreamViewType.NEW_AND_OLD_IMAGES,
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
    });

    // 2. SNS Topic
    const patientCallbackTopic = new sns.Topic(this, 'PatientCallbackTopic', {
      topicName: 'patient-callback-events',
    });

    // 3. enrichment Lambda
    const enrichPatientEventFn = new NodejsFunction(this, 'EnrichPatientEventFn', {
      runtime: lambda.Runtime.NODEJS_20_X,
      entry: 'lambda/enrich/enrich.ts',  // 直接指向 .ts 文件
      handler: 'handler',
      timeout: Duration.seconds(10),
      environment: {
        TABLE_NAME: patientTable.tableName,
      },
    });

    patientTable.grantReadData(enrichPatientEventFn);

    // 4. 简化版回调 Lambda（只打印日志）
    const logCallbackFn = new NodejsFunction(this, 'LogCallbackFn', {
      runtime: lambda.Runtime.NODEJS_20_X,
      entry: 'lambda/log/log.ts',  // 直接指向 .ts 文件
      handler: 'handler',
      timeout: Duration.seconds(5),
    });

    // SNS 订阅 log Lambda
    patientCallbackTopic.addSubscription(new subs.LambdaSubscription(logCallbackFn));

    // 5. EventBridge Pipe
    const pipeRole = new iam.Role(this, 'PipeRole', {
      assumedBy: new iam.ServicePrincipal('pipes.amazonaws.com'),
    });

    // Pipe 访问 DynamoDB Streams
    pipeRole.addToPolicy(
      new iam.PolicyStatement({
        actions: [
          'dynamodb:DescribeStream',
          'dynamodb:GetRecords',
          'dynamodb:GetShardIterator',
          'dynamodb:ListStreams',
        ],
        resources: ['*'],
      })
    );

    // Pipe 调用 enrichment Lambda
    enrichPatientEventFn.grantInvoke(pipeRole);

    // Pipe 发布到 SNS
    patientCallbackTopic.grantPublish(pipeRole);

    new pipes.CfnPipe(this, 'PatientWaitTimePipe', {
      roleArn: pipeRole.roleArn,
      source: patientTable.tableStreamArn!,
      sourceParameters: {
        dynamoDbStreamParameters: {
          startingPosition: 'LATEST',
        },
        filterCriteria: {
          filters: [
            {
              pattern: '{"eventName":["MODIFY"],"dynamodb":{"NewImage":{"waitTimeSeconds":{"N":["800"]}}}}',
              // pattern: '{"eventName":["MODIFY"],"dynamodb":{"NewImage":{"waitTimeSeconds":{"N":[{"numeric":[">",600]}]}}}}',
            },
          ],
        },
      },
      enrichment: enrichPatientEventFn.functionArn,
      target: patientCallbackTopic.topicArn,
    });
  }
}
