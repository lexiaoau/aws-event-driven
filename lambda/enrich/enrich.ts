// lambda/enrich/enrich.ts

interface DynamoDBStreamRecord {
    eventName: string;
    dynamodb?: {
        NewImage?: {
            patientId?: { S: string };
            queueId?: { S: string };
            waitTimeSeconds?: { N: string };
        };
    };
}

export const handler = async (event: DynamoDBStreamRecord[]) => {
    console.log('Raw event from Pipe:', JSON.stringify(event, null, 2));

    // Pipes 传入的是数组，不是 { Records: [] }
    const record = event[0];
    const newImage = record?.dynamodb?.NewImage;

    if (!newImage) {
        console.warn('No NewImage found in record');
        return null;
    }

    const waitTimeSeconds = Number(newImage?.waitTimeSeconds?.N);

    const enrichedEvent = {
        patientId: newImage?.patientId?.S,
        queueId: newImage?.queueId?.S,
        waitTimeSeconds,
        callbackReason: 'EXCEEDED_WAIT_THRESHOLD',
        timestamp: new Date().toISOString(),
    };

    console.log('Enriched event:', JSON.stringify(enrichedEvent, null, 2));
    return enrichedEvent;
};
