import {setTimeout as delay} from 'timers/promises';
import cuid from "cuid";
import open from "open";
import retry from 'async-retry';
import {createGqlClient} from "./gql-client.mjs";
import {gql} from "graphql-request";

class BailableError extends Error {
  bail;

  constructor(...args) {
    super(...args);
    this.bail = false;
  }
}

const openBrowser = async (guid) => {
  const url = `https://app.8base.com/cli?guid=${guid}`;
  await open(url, {wait: false});
}

const waitForToken = async (guid) => {
  return retry(
    async () => {
      const url = `https://api.8base.com/loginSessionGet/${guid}`;
      const response = await fetch(url);
      if (!response.ok) {
        const error = new BailableError(
          `Failed to fetch login session: ${response.status} ${response.statusText}`
        );
        if (response.status === 403) error.bail = true;
        throw error;
      }
      return response.json();
    },
    {retries: 150, factor: 5}
  )
}


const getCurrentUser = async (token) => {
  const client = createGqlClient({idToken: token});
  const CURRENT_USER_QUERY = gql`
      query GetUserAccount {
          system {
              memberAccount {
                  firstName
                  lastName
              }
          }
      }
  `;
  const {system: {memberAccount}} = await client.request(CURRENT_USER_QUERY);
  return memberAccount;
}

export default async function webLogin() {
  const guid = cuid();
  await openBrowser(guid);
  await delay(1000);
  const {idToken} = await waitForToken(guid);
  const user = await getCurrentUser(idToken);
  return {idToken, user};
}