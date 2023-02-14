(() => {

  let inputTimeoutId;
  let currentSortField = 'id';
  let isSortReverse = false;

  document.addEventListener("DOMContentLoaded", initMain);

  function initMain() {
    clientsAppRender.init({ searchInputChange, showNewClientModal, setSort });

    // Render table
    updateTable();

    window.addEventListener('hashchange', hashChangeHandler);

    const hash = window.location.hash;
    if(hash) {
      applyHash(hash);
    }
  }

  function hashChangeHandler() {
    if(window.location.hash.substring(1)) 
      applyHash(window.location.hash);
  }

  async function applyHash(hash) {
    const result = await showEditClientModal(hash.substring(1));

    if(!result) window.location.hash = "";
  }

  function setSort(field) {
    if(currentSortField === field) {
      isSortReverse = !isSortReverse;
    } 
    else {
      isSortReverse = false;
    }
    currentSortField = field;

    updateTable();

    return isSortReverse;
  }

  function sortClientsList(list) {
    switch(currentSortField) {
      case 'full-name': 
        list.sort((a, b) => {
          const aStr = `${a.surname} ${a.name} ${a.lastName}`;
          const bStr = `${b.surname} ${b.name} ${b.lastName}`;

          if(aStr > bStr) return 1;
          if(aStr < bStr) return -1;
          if(aStr === bStr) return 0;
        });
        break;
      case 'created-at': 
        list.sort((a, b) => {
          const aDate = Date.parse(a.createdAt);
          const bDate = Date.parse(b.createdAt);
          return aDate - bDate;
        });
        break;
      case 'updated-at': 
        list.sort((a, b) => {
          const aDate = Date.parse(a.updatedAt);
          const bDate = Date.parse(b.updatedAt);
          return aDate - bDate;
        });
        break;
      // Default sort is id
      default: 
        list.sort((a, b) => {
          return parseInt(a.id) - parseInt(b.id);
        });
    }

    if(isSortReverse) list.reverse();

    return list;
  }

  function searchInputChange() {
    clearTimeout(inputTimeoutId);
    inputTimeoutId = setTimeout(updateTable, 300);
  }

  async function updateTable() {
    const searchInput = document.getElementById('header-search');
    const listDataPromise = clientsAppServerApi.loadClientsData(searchInput.value);

    const handlers = {};
    handlers.editHandler = editButtonHandler;
    handlers.deleteHandler = editModalCancelHandler;

    clientsAppRender.setListLoading();
    let listData = await listDataPromise;
    clientsAppRender.unsetListLoading();

    listData = sortClientsList(listData);

    clientsAppRender.renderTable(listData, handlers);
  }

  function showNewClientModal() {
    const data = {};
    data.title = 'Новый клиент';
    data.cancelLinkString = 'Отмена';

    clientsAppRender.showMainModal(data, { submitHandler: addNewClient, cancelHandler: clientsAppRender.hideMainModal }, { mainInput: mainInputValidation, contactInput: contactInputValidation });
  }

  async function editButtonHandler() {
    clientsAppRender.setEditLoading(this);

    await showEditClientModal(this.clientId);

    clientsAppRender.unsetEditLoading(this);
  }

  async function showEditClientModal(id) {
    const response = await clientsAppServerApi.getClientItemData(id);
    let clientData;

    if(response.ok) clientData = await response.json();
    else return false;

    const data = {};
    data.title = 'Изменить данные';
    data.cancelLinkString = 'Удалить клиента';

    const cancelHandler = function () {
      clientsAppRender.hideMainModal();
      showDeleteClientModal(clientData.id);
    }

    window.location.hash = clientData.id;

    clientsAppRender.showMainModal(data, { submitHandler: editClient, cancelHandler }, { mainInput: mainInputValidation, contactInput: contactInputValidation }, clientData);
    return true;
  }

  function editModalCancelHandler() {
    showDeleteClientModal(this.clientId)
  }

  function showDeleteClientModal(id) {
    clientsAppRender.showDeleteClientModal(id, deleteClient);
  }

  async function editClient(data, id) {
    const response = await clientsAppServerApi.patchClientItemData(data, id);
    return processResponse(response);
  }

  async function deleteClient(id) {
    const response = await clientsAppServerApi.removeClientItemData(id);
    return processResponse(response);
  }

  async function addNewClient(data) {
    const response = await clientsAppServerApi.createClientItemData(data);
    return processResponse(response);
  }

  function mainInputValidation(value, name, flags) {
    const result = {};
    result.ok = true;

    if(flags.required && !value.trim()) {
      result.ok = false;
      result.message = 'Ошибка: Не заполнено поле ' + name;
    }

    return result;
  }

  function contactInputValidation(type, value, flags) {
    const result = {};
    result.ok = true;

    if(flags.required && !value.trim()) {
      result.ok = false;
      result.message = 'Ошибка: Не заполнено поле контакта';
    } 
    else if(type === 'phone' && value.replaceAll('_', '').length !== 18) {
      result.ok = false;
      result.message = 'Ошибка: неправильно заполнен номер телефона';
    }
    else if(type === 'email') {
      if(!/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(value)) { 
        result.ok = false;
        result.message = 'Ошибка: неправильно заполнено поле E-Mail';
      }
    }

    return result;
  }

  async function processResponse(response) {
    if(response.ok) {
      updateTable();
      return '';
    } else {
      updateTable();
      return await getResponseMessage(response);
    }
  }

  async function getResponseMessage(response) {
    switch(response.status) {
      case 404:
        return 'Запрашиваемый элемент не найден';
      case 422:
        const body = await response.json();
        const errors = await body.errors;
        let errorMessage = '';

        for(const error of errors) {
          errorMessage += 'Ошибка: ' + error.message + '<br>';
        }
        return errorMessage;
      case 500:
        return 'Ошибка: Ошибка на стороне сервера';
      default:
        return 'Ошибка: Что-то пошло не так...';
    }
  }

})();
