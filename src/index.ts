import * as path from 'path';
import {join} from 'path';
import fs from 'fs';
import admZip from 'adm-zip';
import Serverless from "serverless";
import get from 'lodash.get'
import {globSync} from 'glob';

class ServerlessEsbuildPrisma {
  engines = [
    'libquery_engine*',
    'libquery_engine-rhel*',

    'libquery_engine*',
    'libquery_engine-rhel*',

    'libquery_engine*',
    'libquery_engine-rhel*',

    'migration-engine*',
    'migration-engine-rhel*',

    'prisma-fmt*',
    'prisma-fmt-rhel*',

    'introspection-engine*',
    'introspection-engine-rhel*',
  ];

  serverless: Serverless;
  options: any;
  commands: any;
  hooks: { [key: string]: Function };
  constructor(serverless: Serverless, options: any) {
    this.serverless = serverless;
    this.options = options;
    this.commands = {
      esbuildprisma: {
        usage: 'Embeds the prisma schema and engine',
        lifecycleEvents: ['package'],
      }
    };
    this.hooks = {
      'after:package:createDeploymentArtifacts': this.onBeforePackageFinalize.bind(this),
    };
  }

  async onBeforePackageFinalize() {

    const functionNames = this.getFunctionNamesForProcess();
    for (const functionName of functionNames) {
      this.writePrismaSchemaAndEngineToZip(functionName);
    }
  }

  writePrismaSchemaAndEngineToZip(functionName: string){
    const fn = this.serverless.service.getFunction(functionName);
    const prismaPath: string = this.getPrismaPath();
    const enginePaths: string[] = globSync(`${prismaPath}/**/{${this.engines.join(',')}}`);
    if("handler" in fn) { // is Serverless.FunctionDefinitionHandler
      const splitFunctionPath = fn.handler?.split('/');
      splitFunctionPath.pop();

      const functionPath = splitFunctionPath.join('/');
      const zipFileName= join('./.serverless/', functionName + ".zip");
      let zip = new admZip(fs.readFileSync(zipFileName))
      zip.addFile(`${functionPath}/schema.prisma`, fs.readFileSync(join(prismaPath, "schema.prisma")));
      enginePaths.forEach((enginePath: string) => {
        zip.addFile(`${functionPath}/${path.basename(enginePath)}`, fs.readFileSync(enginePath));
      })
      zip.writeZip(zipFileName);
    }
  }
  getFunctionNamesForProcess() {
    let packageIndividually = false;
    if("configurationInput" in this.serverless) { // is Serverless
     packageIndividually = (this.serverless.configurationInput as any).package && (this.serverless.configurationInput as any).package.individually;
    }
    return packageIndividually ? this.getAllNodeFunctions() : ['service'];
  }

  getPrismaPath() {
    return get(
      this.serverless,
      'service.custom.prisma.prismaPath',
      this.serverless.config.servicePath
    );
  }

  getIgnoredFunctionNames () {
    return get(
      this.serverless,
      'service.custom.prisma.ignoreFunctions',
      []
    );
  }

  getEsbuildOutputPath() {
    return get(
      this.serverless,
      'service.custom.esbuild.outputDir',
      this.serverless.config.servicePath
    );
  }


  // Ref: https://github.com/serverless-heaven/serverless-esbuild/blob/4785eb5e5520c0ce909b8270e5338ef49fab678e/lib/utils.js#L115
  getAllNodeFunctions() {

    const functions = this.serverless.service.getAllFunctions();
    return functions.filter((funcName) => {
      if (this.getIgnoredFunctionNames().includes(funcName)) {
        return false;
      }
      const func = this.serverless.service.getFunction(funcName);

      // if `uri` is provided or simple remote image path, it means the
      // image isn't built by Serverless so we shouldn't take care of it
      // @ts-ignore
      if (
        ('image' in func && func.image /*&& func.image.uri*/ ||  ('image' in func && func.image && typeof func.image == 'string')))
      {
        return false;
      }

      return this.isNodeRuntime(
        func.runtime || this.serverless.service.provider.runtime || 'nodejs'
      );
    });
  }

  isNodeRuntime(runtime: string) {
    return runtime.match(/node/);
  }
}

module.exports = ServerlessEsbuildPrisma;
