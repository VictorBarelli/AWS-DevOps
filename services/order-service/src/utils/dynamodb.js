/**
 * DynamoDB Client Utility
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const {
    DynamoDBDocumentClient,
    PutCommand,
    QueryCommand,
    UpdateCommand,
    ScanCommand
} = require('@aws-sdk/lib-dynamodb');

// Configure client (works with LocalStack and real AWS)
const config = {
    region: process.env.AWS_REGION || 'us-east-1'
};

// For LocalStack
if (process.env.AWS_ENDPOINT) {
    config.endpoint = process.env.AWS_ENDPOINT;
    config.credentials = {
        accessKeyId: 'test',
        secretAccessKey: 'test'
    };
}

const client = new DynamoDBClient(config);
const docClient = DynamoDBDocumentClient.from(client);

/**
 * Put item into table
 */
async function putItem(tableName, item) {
    const command = new PutCommand({
        TableName: tableName,
        Item: item
    });
    await docClient.send(command);
    return item;
}

/**
 * Query by order_id (hash key)
 */
async function queryByOrderId(tableName, orderId) {
    const command = new QueryCommand({
        TableName: tableName,
        KeyConditionExpression: 'order_id = :orderId',
        ExpressionAttributeValues: {
            ':orderId': orderId
        }
    });
    const response = await docClient.send(command);
    return response.Items;
}

/**
 * Query by user_id using GSI
 */
async function queryByUserId(tableName, userId) {
    const command = new QueryCommand({
        TableName: tableName,
        IndexName: 'user-orders-index',
        KeyConditionExpression: 'user_id = :userId',
        ExpressionAttributeValues: {
            ':userId': userId
        },
        ScanIndexForward: false // Newest first
    });
    const response = await docClient.send(command);
    return response.Items;
}

/**
 * Update item
 */
async function updateItem(tableName, key, updates) {
    const updateExpressions = [];
    const expressionAttributeNames = {};
    const expressionAttributeValues = {};

    Object.entries(updates).forEach(([field, value], index) => {
        const attrName = `#field${index}`;
        const attrValue = `:value${index}`;
        updateExpressions.push(`${attrName} = ${attrValue}`);
        expressionAttributeNames[attrName] = field;
        expressionAttributeValues[attrValue] = value;
    });

    const command = new UpdateCommand({
        TableName: tableName,
        Key: key,
        UpdateExpression: `SET ${updateExpressions.join(', ')}`,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues,
        ReturnValues: 'ALL_NEW'
    });

    const response = await docClient.send(command);
    return response.Attributes;
}

/**
 * Check DynamoDB connection
 */
async function checkConnection() {
    const command = new ScanCommand({
        TableName: process.env.DYNAMODB_TABLE || 'oracle-devops-dev-orders',
        Limit: 1
    });
    await docClient.send(command);
    return true;
}

module.exports = {
    putItem,
    queryByOrderId,
    queryByUserId,
    updateItem,
    checkConnection
};
