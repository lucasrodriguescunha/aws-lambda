// Importa o SDK da AWS para Node.js
import { DynamoDB } from "aws-sdk";

// Cria um cliente do DynamoDB para trabalhar com documentos
const dynamo = new DynamoDB.DocumentClient();

// Exporta a função handler que será executada pelo AWS Lambda
export async function handler(event) {
  // Loga o evento recebido para fins de depuração
  console.log("Event: ", JSON.stringify(event));

  // Variáveis para armazenar o corpo da resposta e o código de status HTTP
  let body;
  let statusCode = 200;

  // Define os cabeçalhos padrão da resposta HTTP
  const headers = {
    "Content-Type": "application/json",
  };

  try {
    // Variável para armazenar o JSON da requisição
    let requestJSON;

    // Verifica qual é a rota da requisição e executa a lógica correspondente
    switch (event.routeKey) {
      case "POST /items":
        // Para a rota POST /items, se houver um corpo na requisição, parseia o JSON e insere um item no DynamoDB
        if (event.body) {
          requestJSON = JSON.parse(event.body);
          console.log("Request JSON: ", requestJSON); // Log do corpo da requisição
          await dynamo
            .put({
              TableName: "Product",
              Item: {
                id: requestJSON.id,
                name: requestJSON.name,
              },
            })
            .promise();
          body = `Created item with ID: ${requestJSON.id}`;
        } else {
          // Lança um erro se o corpo da requisição estiver ausente
          throw new Error("Request body is missing");
        }
        break;

      case "DELETE /items/{id}":
        // Para a rota DELETE /items/{id}, deleta o item do DynamoDB com o id fornecido
        console.log("Path Parameters: ", event.pathParameters); // Log dos parâmetros da rota
        await dynamo
          .delete({
            TableName: "Product",
            Key: {
              id: event.pathParameters.id,
            },
          })
          .promise();
        body = `Deleted item with ID: ${event.pathParameters.id}`;
        break;

      case "GET /items/{id}":
        // Para a rota GET /items/{id}, obtém o item do DynamoDB com o id fornecido
        console.log("Path Parameters: ", event.pathParameters); // Log dos parâmetros da rota
        body = await dynamo
          .get({
            TableName: "Product",
            Key: {
              id: event.pathParameters.id,
            },
          })
          .promise();
        break;

      case "GET /items":
        // Para a rota GET /items, escaneia a tabela inteira e retorna todos os itens
        body = await dynamo.scan({ TableName: "Product" }).promise();
        break;

      case "PUT /items/{id}":
        // Para a rota PUT /items/{id}, se houver um corpo na requisição, parseia o JSON e atualiza o item no DynamoDB
        if (event.body) {
          requestJSON = JSON.parse(event.body);
          console.log("Request JSON: ", requestJSON); // Log do corpo da requisição
          await dynamo
            .update({
              TableName: "Product",
              Key: {
                id: event.pathParameters.id,
              },
              UpdateExpression: "set price = :r",
              ExpressionAttributeValues: {
                ":r": requestJSON.price,
              },
            })
            .promise();
          body = `Updated item with ID: ${event.pathParameters.id}`;
        } else {
          // Lança um erro se o corpo da requisição estiver ausente
          throw new Error("Request body is missing");
        }
        break;

      default:
        // Lança um erro para rotas não suportadas
        throw new Error(`Unsupported route: "${event.routeKey}"`);
    }
  } catch (err) {
    // Loga o erro e define o código de status HTTP como 500 (erro interno do servidor)
    console.error("Error: ", err); // Log do erro
    statusCode = 500;
    body = { message: "Internal Server Error", details: err.message };
  } finally {
    // Converte o corpo da resposta para JSON
    body = JSON.stringify(body);
  }

  // Loga a resposta para fins de depuração
  console.log("Response: ", { statusCode, body, headers });

  // Retorna a resposta HTTP
  return {
    statusCode,
    body,
    headers,
  };
}
