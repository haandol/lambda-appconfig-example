import * as path from 'path';
import * as cdk from '@aws-cdk/core';
import * as iam from '@aws-cdk/aws-iam';
import * as lambda from '@aws-cdk/aws-lambda';
import * as appconfig from '@aws-cdk/aws-appconfig';
import { ns, configContent } from '../interfaces/config';

export class InfraStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const appConfig = new MyAppConfig(this, `MyAppConfig`, {
      content: configContent,
    });

    const appConfigLayer = lambda.LayerVersion.fromLayerVersionArn(
      this,
      `AppConfigExtLayer`,
      'arn:aws:lambda:ap-northeast-2:826293736237:layer:AWS-AppConfig-Extension:49'
    );
    const fn = new lambda.Function(this, `Function`, {
      functionName: `${ns}AppConfigTestFunction`,
      code: lambda.Code.fromAsset(path.join(__dirname, '..', 'functions')),
      runtime: lambda.Runtime.PYTHON_3_8,
      handler: 'app.handler',
      layers: [appConfigLayer],
      tracing: lambda.Tracing.ACTIVE,
      environment: {
        APP_NAME: appConfig.appName,
        ENV_NAME: appConfig.envName,
        PROFILE_NAME: appConfig.profileName,
      },
    });
    fn.addToRolePolicy(new iam.PolicyStatement({
      actions: ['appconfig:GetConfiguration'],
      effect: iam.Effect.ALLOW,
      resources: ['*'],
    }))
  }
}

interface IConfigProps {
  content: any;
}

export class MyAppConfig extends cdk.Construct {
  public readonly appName: string;
  public readonly envName: string;
  public readonly profileName: string;

  constructor(scope: cdk.Construct, id: string, props: IConfigProps) {
    super(scope, id);

    const configApp = new appconfig.CfnApplication(this, `Application`, {
      name: `${ns}Application`,
    });
    const configEnv = new appconfig.CfnEnvironment(this, `Environment`, {
      applicationId: configApp.ref,
      name: `${ns}Environment`,
    });
    const configProfile = new appconfig.CfnConfigurationProfile(this, `ConfigProfile`, {
      applicationId: configApp.ref,
      locationUri: 'hosted',
      validators: [{
        content: '{}',
        type: 'JSON_SCHEMA', 
      }],
      name: `${ns}ConfigProfile`,
    });
    const configValue = new appconfig.CfnHostedConfigurationVersion(this, `HostedConfigValue`, {
      applicationId: configApp.ref,
      configurationProfileId: configProfile.ref,
      content: JSON.stringify(props.content),
      contentType: 'application/json',
    });
    const configDeployStrategy = new appconfig.CfnDeploymentStrategy(this, `DeploymentStrategy`, {
      name: `${ns}DevDeployStrategy`,
      deploymentDurationInMinutes: 0,
      growthFactor: 100,
      growthType: 'LINEAR',
      finalBakeTimeInMinutes: 0,
      replicateTo: 'NONE',
    });
    new appconfig.CfnDeployment(this, `Deployment`, {
      applicationId: configApp.ref,
      configurationProfileId: configProfile.ref,
      environmentId: configEnv.ref,
      deploymentStrategyId: configDeployStrategy.ref,
      configurationVersion: `${configValue.ref}`,
    });

    this.appName = configApp.name;
    this.envName = configEnv.name;
    this.profileName = configProfile.name;
  }
}
