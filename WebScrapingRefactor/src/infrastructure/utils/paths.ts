import path from  'path';

export function getAppRootDir():string {
    const isCompiled = process.execPath.endsWith('.exe') && 
                       !process.execPath.endsWith('node.exe');
    return isCompiled ? path.dirname(process.execPath) : process.cwd();

}