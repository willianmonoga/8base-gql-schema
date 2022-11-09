import yargs from 'yargs';
import {hideBin} from 'yargs/helpers';
import {Logger} from "../src/logger.mjs";
import webLogin from "../src/weblogin.mjs";
import downloadIntrospection from "../src/downloadIntrospection.mjs";

const logger = new Logger();


yargs(hideBin(process.argv))
  .command(
    ['download', '$0'],
    'Download gql schema',
    (yargs) => yargs.option('output', {
      alias: 'o',
      describe: 'Output file',
      type: 'string',
      demandOption: true,
    }),
    async ({output}) => {
      const spinner = logger.wait('Signing in...');
      const {idToken, user} = await webLogin();
      spinner.succeed(`Signed in as ${user.firstName} ${user.lastName}`);
      const spinner2 = logger.wait('Downloading schema...');
      await downloadIntrospection({
        idToken,
        output
      });
      spinner2.succeed('Schema downloaded');
    }
  )
  .parse();