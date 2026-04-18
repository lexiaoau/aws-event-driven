# AWS Event-Driven Architecture

> **DynamoDB Streams → EventBridge Pipes → Lambda → SNS**

An event-driven notification pipeline built with AWS CDK (TypeScript). Changes captured in DynamoDB are streamed through EventBridge Pipes, processed by a Lambda function, and published to SNS for downstream consumers.

---

## Architecture

```
┌─────────────┐    ┌──────────────────┐    ┌────────────┐    ┌─────┐
│  DynamoDB   │───▶│ EventBridge Pipes│───▶│   Lambda   │───▶│ SNS │
│   (Table)   │    │   (Filter/Enrich)│    │ (Process)  │    │     │
└─────────────┘    └──────────────────┘    └────────────┘    └─────┘
      │
 DynamoDB Streams
 (INSERT / MODIFY / REMOVE)
```

| Component | Role |
|---|---|
| **DynamoDB Streams** | Captures item-level changes (INSERT, MODIFY, REMOVE) in real time |
| **EventBridge Pipes** | Routes and optionally filters/enriches stream records before invoking Lambda |
| **Lambda** | Processes the event payload and publishes structured notifications |
| **SNS** | Fans out notifications to subscribed endpoints (email, SQS, HTTP, etc.) |

---

## Prerequisites

- [AWS CDK](https://docs.aws.amazon.com/cdk/v2/guide/getting_started.html) v2 (`npm install -g aws-cdk`)
- AWS CLI configured with appropriate credentials (`aws configure`)
- An AWS account bootstrapped for CDK:

```bash
cdk bootstrap aws://<ACCOUNT_ID>/<REGION>
```

---

## Project Structure

```
aws-event-driven/
├── bin/                  # CDK app entry point
├── lambda/               # Lambda function source code
├── lib/                  # CDK stack definition
│   └── aws-event-driven-stack.ts
├── cdk.json              # CDK configuration
├── package.json
└── tsconfig.json
```

---

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Build the project

```bash
npm run build
```

### 3. Review the synthesized CloudFormation template

```bash
cdk synth
```

### 4. Deploy to AWS

```bash
cdk deploy
```

To specify a target AWS profile or region:

```bash
cdk deploy --profile <your-profile> --region <aws-region>
```

---

## How It Works

1. **DynamoDB Streams** is enabled on the table to capture change events.
2. **EventBridge Pipes** connects the stream as a source and Lambda as the target. You can optionally configure:
   - **Filtering** – only forward specific event types (e.g. `INSERT` only).
   - **Enrichment** – invoke a separate Lambda or API Gateway to transform records before processing.
3. **Lambda** receives the filtered/enriched event, extracts relevant data, and publishes a message to the **SNS topic**.
4. **SNS** delivers the notification to all subscribed endpoints.

---

## Configuration

Key configuration is managed inside the CDK stack (`lib/aws-event-driven-stack.ts`). Common values to customise:

| Setting | Description |
|---|---|
| `tableName` | Name of the DynamoDB table |
| `streamViewType` | Stream record type (`NEW_IMAGE`, `OLD_IMAGE`, `NEW_AND_OLD_IMAGES`) |
| `pipeFilterCriteria` | EventBridge Pipes event filter pattern |
| `snsTopicName` | Name of the SNS topic |
| `lambdaHandler` | Path to the Lambda handler in `lambda/` |

---

## Useful CDK Commands

| Command | Description |
|---|---|
| `npm run build` | Compile TypeScript to JavaScript |
| `npm run watch` | Watch for changes and recompile |
| `cdk synth` | Synthesise the CloudFormation template |
| `cdk diff` | Compare deployed stack with current state |
| `cdk deploy` | Deploy the stack to AWS |
| `cdk destroy` | Tear down all deployed resources |

---

## Other Useful Commands

| Command | Description |
|---|---|
| `aws logs tail   /aws/lambda/<lambda-func-full-name>  --follow` | Watch lambda log |
| `npx cdk deploy` | Run cdk deploy |


```bash
aws dynamodb update-item \
  --table-name AwsEventDrivenStack-PatientQueueTable750150DF-1MREW41LCTF0M \
  --key '{"patientId": {"S": "P123"}, "queueId": {"S": "Q1"}}' \
  --update-expression "SET waitTimeSeconds = :val" \
  --expression-attribute-values '{":val": {"N": "800"}}'`
``` 
  
  | Update item in DynamoDB table |



---

## Raw Event example

<details>
  <summary>Raw event from Pipe</summary>

```js
[
  {
    "eventID": "140e9cd556c7b3764cd4e7fa85f389c4",
    "eventName": "MODIFY",
    "eventVersion": "1.1",
    "eventSource": "aws:dynamodb",
    "awsRegion": "ap-southeast-2",
    "dynamodb": {
      "ApproximateCreationDateTime": 1776473392,
      "Keys": {
        "queueId": {
          "S": "Q1"
        },
        "patientId": {
          "S": "P123"
        }
      },
      "NewImage": {
        "queueId": {
          "S": "Q1"
        },
        "waitTimeSeconds": {
          "N": "800"
        },
        "patientId": {
          "S": "P123"
        }
      },
      "OldImage": {
        "queueId": {
          "S": "Q1"
        },
        "waitTimeSeconds": {
          "N": "900"
        },
        "patientId": {
          "S": "P123"
        }
      },
      "SequenceNumber": "7017200000352847893195899",
      "SizeBytes": 100,
      "StreamViewType": "NEW_AND_OLD_IMAGES"
    },
    "eventSourceARN": "arn:aws:dynamodb:ap-southeast-2:<id>:table/AwsEventDrivenStack-PatientQueueTable<id>/stream/2026-04-16T12:50:35.374"
  }
]
```

</details>

<details>
  <summary>Raw SNS event</summary>

```js
{
  "Records": [
    {
      "EventSource": "aws:sns",
      "EventVersion": "1.0",
      "EventSubscriptionArn": "arn:aws:sns:ap-southeast-2:<id>:patient-callback-events:<event-id>",
      "Sns": {
        "Type": "Notification",
        "MessageId": "9f37d2b8-312c-57a8-a1a0-b0e4e65ddac7",
        "TopicArn": "arn:aws:sns:ap-southeast-2:<id>:patient-callback-events",
        "Message": "{\"patientId\":\"P123\",\"queueId\":\"Q1\",\"waitTimeSeconds\":800,\"callbackReason\":\"EXCEEDED_WAIT_THRESHOLD\",\"timestamp\":\"2026-04-18T00:49:53.552Z\"}",
        "Timestamp": "2026-04-18T00:49:53.582Z",
        "SignatureVersion": "1",
        "Signature": "<long-string>",
        "SigningCertUrl": "https://sns.ap-southeast-2.amazonaws.com/<id>.pem",
        "Subject": null,
        "UnsubscribeUrl": "https://sns.ap-southeast-2.amazonaws.com/?Action=Unsubscribe&SubscriptionArn=arn:aws:sns:ap-southeast-2:<id>:patient-callback-events:<id>",
        "MessageAttributes": {}
      }
    }
  ]
}
```

</details>

---

## Notes

- The dynamo item value passed to pipe is of **String** type even if it's numeric in table.
- Need to create an IAM role for cdk deploy first.
- If cdk deploy has error, one way to resolve it is to go to CloudFormation and manually delete the stack and all its resources.
- Pipe filter can be created in UI, but better to add it in cdk code as raw string.

---


## Clean Up

To avoid ongoing AWS charges, destroy the stack when it is no longer needed:

```bash
cdk destroy
```

---

## License

This project is open source. See [LICENSE](LICENSE) for details.
