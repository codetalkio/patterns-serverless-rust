use async_graphql;
use lambda::Context;
use serde_json;

use crate::global::SCHEMA;
use crate::types::Error;

pub async fn handler(event: serde_json::Value, _: Context) -> Result<async_graphql::Value, Error> {
    let query = event["query"].as_str().unwrap_or("{}");
    let data = SCHEMA.execute(query).await.data;
    Ok(data)
}
