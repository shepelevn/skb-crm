(() => {

  window.clientsAppServerApi = {};

  const SERVER_URL = 'http://localhost:3000/api/clients';
  // const SERVER_URL = 'http://192.168.0.91:3000/api/clients';
  const SEARCH_PARAMETER_NAME = 'search';

  window.clientsAppServerApi.removeClientItemData = function removeClientItemData(removeId) {
    const response = fetch(`${SERVER_URL}/${removeId}`, {
      method: 'DELETE', 
    });

    return response;
  }

  window.clientsAppServerApi.patchClientItemData = async function patchClientItemData(clientObjectData, id) {
    const response = await fetch(`${SERVER_URL}/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(clientObjectData)
    });

    // const itemData = await response.json();

    return response;
  }

  window.clientsAppServerApi.createClientItemData = async function createClientItemData(clientObjectData) {
    const response = await fetch(`${SERVER_URL}`, {
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(clientObjectData), 
    });

    // const itemData = await response.json();

    return response;
  }

  window.clientsAppServerApi.getClientItemData = async function getClientItemData(id) {
    const url = `${SERVER_URL}/${id}`;

    const response = await fetch(url);

    return response;
  }

  window.clientsAppServerApi.loadClientsData = async function loadClientsData(search) {
    let url = SERVER_URL;
    if(search) {
      url += `?${SEARCH_PARAMETER_NAME}=${search}`;
    }

    const response = await fetch(url);
    const dataArray = await response.json();

    return dataArray;
  }

})();
