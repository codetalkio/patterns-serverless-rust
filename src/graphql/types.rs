use async_graphql::SimpleObject;
use serde::Serialize;

#[derive(Serialize, SimpleObject)]
pub struct Actor {
    pub name: String,
    pub movie: String,
}

#[derive(Serialize, SimpleObject)]
pub struct Movie {
    pub name: String,
    pub year: u16,
}
