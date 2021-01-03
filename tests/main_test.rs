use async_graphql::value;
use lambda::Context;
use serde_json::json;

use lib::graphql::types::*;
use lib::handler::handler;

#[tokio::test]
async fn handler_handles_basic_event() {
    let event = json!({
        "query": "{ movies { name year } }"
    });
    let expected = value!({
        "movies": vec![Movie {
            name: "Bill and Ted".to_string(),
            year: 1989,
        }]
    });
    let result = handler(event.clone(), Context::default())
        .await
        .expect("expected Ok(_) value");
    assert_eq!(result, expected)
}
