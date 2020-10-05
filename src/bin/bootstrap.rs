use lambda::handler_fn;

use ::lib::handler::handler;
use ::lib::types::Error;

#[tokio::main]
async fn main() -> Result<(), Error> {
    // Attach our own handler function to the lambda rust runtime, and run it.
    let runtime_handler = handler_fn(handler);
    lambda::run(runtime_handler).await?;
    Ok(())
}
