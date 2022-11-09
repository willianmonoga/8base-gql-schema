import enquirer  from 'enquirer';
import fs from "node:fs/promises";
import {createGqlClient} from "./gql-client.mjs";

const INTROSPECTION_FILE_URL_QUERY = `
  query IntrospectionUrl {
    system {
      introspection {
        url
      }
    }
  }
`;
const getIntrospectionFileUrl = ({idToken, workspaceId, environment}) => {
  const client = createGqlClient({idToken, workspaceId, environment});
  return client
    .request(INTROSPECTION_FILE_URL_QUERY)
    .then(({system: {introspection: {url}}}) => url);
};

const downloadIntrospectionFile = async (url, output) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`
    Unexpected error occurred while downloading introspection file:
     + ${response.statusText} (${response.status})
     + ${await response.text()}
    `);
  }
  await fs.writeFile(output, response.body);
};

const getWorkspaces = async (idToken) => {
  const client = createGqlClient({idToken});
  const { system: {workspacesList: {items: workspaces}} } = await client.request(`
    query {
      system {
        workspacesList {
          items {
            id
            name
          }
        }
      }
    }
  `);
  return workspaces;
}

const getEnvironments = async (idToken, workspaceId) => {
  const client = createGqlClient({idToken, workspaceId});
  const { system: {environmentsList: {items: environments}} } = await client.request(`
    query EnvironmentsList {
      system {
        environmentsList { items { name } }
      }
    }
  `);
  return environments;
}

const selectWorkspaceAndEnvironment = async (idToken) => {
  const workspaces = await getWorkspaces(idToken);
  const {workspace: selectedWorkspaceId} = await enquirer.prompt({
    type: 'select',
    name: 'workspace',
    message: 'Select workspace',
    choices: workspaces.map(({id, name}) => ({message: name, name: id})),
  });
  const environments = await getEnvironments(idToken, selectedWorkspaceId);
  const {environment: selectedEnvironmentId} = await enquirer.prompt({
    type: 'select',
    name: 'environment',
    message: 'Select environment',
    choices: environments,
  });
  return {workspaceId: selectedWorkspaceId, environment: selectedEnvironmentId};
}

export default async function downloadIntrospection({idToken, output}) {
  const {workspaceId, environment} = await selectWorkspaceAndEnvironment(idToken);
  const introspectionFileUrl = await getIntrospectionFileUrl({idToken, workspaceId, environment});
  await downloadIntrospectionFile(introspectionFileUrl, output);
}