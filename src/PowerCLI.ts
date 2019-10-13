// src/PowerCLI.ts
import Shell from 'node-powershell';

interface LoginCredentials {
  server: string;
  username: string;
  password: string;
}

export class PowerCLI {
  public command: string;
  public shell: Shell;
  public select: string[];

  private run(command: string): Promise<string> {
    this.shell.addCommand(command);

    return this.shell.invoke();
  }

  async initShell({ server, username, password }: LoginCredentials): Promise<void> {
    const shell = new Shell({
      executionPolicy: 'Bypass',
      noProfile: true
    });

    this.shell = shell;

    await this.run('Set-PowerCLIConfiguration -InvalidCertificateAction Ignore -Confirm:$false');

    await this.run(`Connect-VIServer -Server ${server} -Protocol https -Username ${username} -Password ${password}`);
  }

  private addCommand(command: string): PowerCLI {
    if (!this.command) this.command = `${command}`;
    else this.command = `${this.command} | ${command}`;
    return this;
  }

  async exec(): Promise<string> {
    const res = await this.run(this.command);
    this.command = undefined;
    return res;
  }

  async execJSONSelect<T>(): Promise<T> {
    this.command = `${this.command} | Select -Property ${this.select.join(',')} | ConvertTo-Json -Depth 3`;
    const result = await this.run(this.command);
    return JSON.parse(result);
  }

  getVMs(): PowerCLI {
    this.select = ['Name', 'MemoryGB', 'MemoryMB', 'NumCpu', 'CoresPerSocket', 'PowerState', 'Notes', 'Id'];
    return this.addCommand(`Get-VM`);
  }

  dispose(): void {
    this.shell.dispose();
  }
}
