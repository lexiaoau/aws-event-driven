// 修改前：错误地使用了 DynamoDBStreamEvent 类型
// import { DynamoDBStreamEvent } from 'aws-lambda';

export const handler = async (event: any[]) => {
    // Pipes 传入的是数组，直接取第一个元素
    const record = event[0];
    const newImage = record.dynamodb?.NewImage;

    console.log('Raw event:', JSON.stringify(event, null, 2));

    const enrichedEvent = {
        patientId: newImage?.patientId?.S,
        queueId: newImage?.queueId?.S,
        waitTimeSeconds: Number(newImage?.waitTimeSeconds?.N),
        callbackReason: 'EXCEEDED_WAIT_THRESHOLD',
        timestamp: new Date().toISOString(),
    };

    console.log('Enriched event:', JSON.stringify(enrichedEvent, null, 2));

    return enrichedEvent;
};
