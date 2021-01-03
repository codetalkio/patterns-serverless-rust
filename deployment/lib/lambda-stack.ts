import * as core from "@aws-cdk/core";
import * as cdkEvents from "@aws-cdk/aws-events";
import * as cdkEventTargets from "@aws-cdk/aws-events-targets";
import * as s3 from "@aws-cdk/aws-s3";
import * as iam from "@aws-cdk/aws-iam";
import * as dynamo from "@aws-cdk/aws-dynamodb";
import * as lambda from "@aws-cdk/aws-lambda";
import * as cdk from "@aws-cdk/core";

const { CDK_LOCAL } = process.env;

interface Props {
  /**
   * The DynamoDB table.
   */
  table: dynamo.Table;

  /**
   * Keep the Lambda function warm by pinging it on a schedule (default: false).
   */
  keepWarm?: boolean;

  /**
   * Set the number of Lambdas to keep warm (default: 5).
   */
  concurrencyNumber?: number;
}

export class LambdaStack extends core.Stack {
  constructor(scope: cdk.App, id: string, props: Props) {
    super(scope, id);

    const bootstrapLocation = `${__dirname}/../../target/cdk/release`;

    // Our Lambda function details.
    const entryId = "main";
    const entryFnName = `${id}-${entryId}`;
    const entry = new lambda.Function(this, entryId, {
      functionName: entryFnName,
      description: "Rust serverless microservice",
      runtime: lambda.Runtime.PROVIDED,
      handler: `${id}`, // The handler value syntax is `{cargo-package-name}.{bin-name}`.
      code:
        CDK_LOCAL !== "true"
          ? lambda.Code.fromAsset(bootstrapLocation)
          : lambda.Code.fromBucket(s3.Bucket.fromBucketName(this, `LocalBucket`, "__local__"), bootstrapLocation),
      memorySize: 128,
      timeout: cdk.Duration.seconds(10),
      tracing: lambda.Tracing.ACTIVE,
    });

    // Our Lambda function environment variables.
    entry.addEnvironment("AWS_NODEJS_CONNECTION_REUSE_ENABLED", "1");

    // Tag our resource.
    core.Aspects.of(entry).add(new cdk.Tag("service-type", "API"));
    core.Aspects.of(entry).add(new cdk.Tag("billing", `lambda-${entryFnName}`));

    // Set up the DynamoDB operations the function is allowed on the table ARN.
    props.table.grantReadWriteData(entry);

    // Optionally: Keep the lambda function warm by pinging `concurrencyNumber` of it every 5 minutes (this will obvisouly cost a tiny, tiny bit).
    if (props.keepWarm) {
      const concurrencyNumber = props.concurrencyNumber ?? 5;
      const warmer = new cdkEvents.Rule(this, "Warmer", {
        schedule: cdkEvents.Schedule.expression("rate(5 minutes)"),
      });
      warmer.addTarget(
        new cdkEventTargets.LambdaFunction(entry, {
          event: cdkEvents.RuleTargetInput.fromObject({ warmer: true, concurrency: concurrencyNumber }),
        })
      );
    }
  }
}
