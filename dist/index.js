"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path = __importStar(require("path"));
const path_1 = require("path");
const fs_1 = __importDefault(require("fs"));
const adm_zip_1 = __importDefault(require("adm-zip"));
const lodash_get_1 = __importDefault(require("lodash.get"));
const glob_1 = require("glob");
class ServerlessEsbuildPrisma {
    constructor(serverless, options) {
        this.engines = [
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
    onBeforePackageFinalize() {
        return __awaiter(this, void 0, void 0, function* () {
            const functionNames = this.getFunctionNamesForProcess();
            for (const functionName of functionNames) {
                this.writePrismaSchemaAndEngineToZip(functionName);
            }
        });
    }
    writePrismaSchemaAndEngineToZip(functionName) {
        var _a;
        const fn = this.serverless.service.getFunction(functionName);
        const prismaPath = this.getPrismaPath();
        const enginePaths = (0, glob_1.globSync)(`${prismaPath}/**/{${this.engines.join(',')}}`);
        if ("handler" in fn) { // is Serverless.FunctionDefinitionHandler
            const splitFunctionPath = (_a = fn.handler) === null || _a === void 0 ? void 0 : _a.split('/');
            splitFunctionPath.pop();
            const functionPath = splitFunctionPath.join('/');
            const zipFileName = (0, path_1.join)('./.serverless/', functionName + ".zip");
            let zip = new adm_zip_1.default(fs_1.default.readFileSync(zipFileName));
            zip.addFile(`${functionPath}/schema.prisma`, fs_1.default.readFileSync((0, path_1.join)(prismaPath, "schema.prisma")));
            enginePaths.forEach((enginePath) => {
                zip.addFile(`${functionPath}/${path.basename(enginePath)}`, fs_1.default.readFileSync(enginePath));
            });
            zip.writeZip(zipFileName);
        }
    }
    getFunctionNamesForProcess() {
        let packageIndividually = false;
        if ("configurationInput" in this.serverless) { // is Serverless
            packageIndividually = this.serverless.configurationInput.package && this.serverless.configurationInput.package.individually;
        }
        return packageIndividually ? this.getAllNodeFunctions() : ['service'];
    }
    getPrismaPath() {
        return (0, lodash_get_1.default)(this.serverless, 'service.custom.prisma.prismaPath', this.serverless.config.servicePath);
    }
    getIgnoredFunctionNames() {
        return (0, lodash_get_1.default)(this.serverless, 'service.custom.prisma.ignoreFunctions', []);
    }
    getEsbuildOutputPath() {
        return (0, lodash_get_1.default)(this.serverless, 'service.custom.esbuild.outputDir', this.serverless.config.servicePath);
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
            if (('image' in func && func.image /*&& func.image.uri*/ || ('image' in func && func.image && typeof func.image == 'string'))) {
                return false;
            }
            return this.isNodeRuntime(func.runtime || this.serverless.service.provider.runtime || 'nodejs');
        });
    }
    isNodeRuntime(runtime) {
        return runtime.match(/node/);
    }
}
module.exports = ServerlessEsbuildPrisma;
