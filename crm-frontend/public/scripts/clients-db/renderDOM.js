(() => {
  window.clientsAppRender = {};

  const MAX_CONTACTS_VISIBLE = 4;
  const MAX_CONTACTS = 10;

  let mainModal;
  let deleteModal;
  let currentSortLink;
  let currentEditButtonLoading;

  const contactTypeDOMData = {
    'phone': {
      src: 'images/phone.svg', 
      alt: 'Телефон', 
      tooltip: (string) => {
        // const d = dataString;
        // return `${d.substring(0, 2)}(${d.substring(3, 6)}) ${d.substring(7, 10)}-${d.substring(11-13)}-${d.substring(14-16)}`;
        return `Телефон: ${renderTooltipHighlight(string)}`;
      }, 
      href: 'tel:', 
    }, 
    'email': {
      src: 'images/mail.svg', 
      alt: 'Электронная почта', 
      tooltip: (string) => {
        return `E-mail: ${renderTooltipHighlight(string)}`;
      }, 
      href: 'mailto:', 
    }, 
    'facebook': {
      src: 'images/fb.svg', 
      alt: 'Facebook', 
      tooltip: (string) => {
        return 'Facebook: ' + renderTooltipHighlight(string.substring(string.lastIndexOf('/') + 1));
      }, 
      href: '', 
    }, 
    'vk': {
      src: 'images/vk.svg', 
      alt: 'ВКонтакте', 
      tooltip: () => 'Not implemented', 
      tooltip: (string) => {
        return 'VK: ' + renderTooltipHighlight(string.substring(string.lastIndexOf('/') + 1));
      }, 
      href: '', 
    }, 
    'other': {
      src: 'images/other.svg', 
      alt: 'Скопировать контакт', 
      tooltip: (string) => {
        return 'Скопировать: ' + renderTooltipHighlight(string);
      }, 
      href: '', 
    }, 
  };

  window.clientsAppRender.init = function (handlers) {
    // Init search input
    const searchInput = document.getElementById('header-search');
    searchInput.addEventListener('input', handlers.searchInputChange)

    // Init add client button
    const addButton = document.getElementById('add-client-button');
    addButton.addEventListener('click', handlers.showNewClientModal)

    // Init add contact button
    const addContactButton = document.getElementById('add-contact');
    addContactButton.addEventListener('click', newContact)

    // Init sort buttons
    const sortButtons = document.querySelectorAll('.sort');
    for(const sortButton of sortButtons) {
      sortButton.addEventListener('click', createSetSortHandler(handlers.setSort));
    }
    currentSortLink = document.querySelector('.sort_set');

    // Init modals
    mainModal = new bootstrap.Modal(document.getElementById('main-modal'));
    document.getElementById('main-modal')
      .addEventListener('hide.bs.modal', () => {
        const form = document.querySelector('.modal__form');
        form.removeEventListener('submit', form.listener)
      });

    deleteModal = new bootstrap.Modal(document.getElementById('delete-modal'));
    document.getElementById('delete-modal')
      .addEventListener('hide.bs.modal', () => {
        const deleteButton = document.getElementById('modal-delete-button');
        deleteButton.removeEventListener('click', deleteButton.listener);
      });
  }

  window.clientsAppRender.renderTable = function (listData, handlers) {
    // Remove old rows
    const rows = document.querySelectorAll('.clients__row');
    for(const row of rows) row.remove();

    // Add new rows
    const rowEmpty = document.querySelector('.clients__empty-row');

    for(const listItem of listData) {
      const newRow = renderClientRow(listItem, handlers);
      rowEmpty.before(newRow);
    }
  }

  window.clientsAppRender.setListLoading = function () {
    const table = document.querySelector('.clients__table-responsive');
    table.classList.add('clients__table-responsive_loading');
  }

  window.clientsAppRender.unsetListLoading = function () {
    const table = document.querySelector('.clients__table-responsive');
    table.classList.remove('clients__table-responsive_loading');
  }

  window.clientsAppRender.setEditLoading = function(button) {
    currentEditButtonLoading = button;
    button.classList.add('edit_loading');
  }

  window.clientsAppRender.unsetEditLoading = function() {
    if(currentEditButtonLoading)
      currentEditButtonLoading.classList.remove('edit_loading');
  }

  window.clientsAppRender.showMainModal = function (data, handlers, validators, clientData = null) {
    resetMainFormValidation();

    const modal = document.getElementById('main-modal');

    const title = modal.querySelector('.modal__title');
    title.innerText = data.title;

    const inputs = document.querySelectorAll('.modal__input .secondary-input__input');
    const idDiv = modal.querySelector('.modal__id');
    const contacts = modal.querySelectorAll('.contact');

    for(const contactDiv of contacts) contactDiv.remove();

    if(clientData) {
      inputs[0].value = clientData.surname;
      inputs[1].value = clientData.name;
      inputs[2].value = clientData.lastName;

      idDiv.innerHTML = `<span class="nowrap">ID: ${clientData.id}</span>`;
      for(const contact of clientData.contacts) {
        addContact(contact);
      }
    } else {
      for(const input of inputs) input.value = '';

      idDiv.innerText = '';
    }

    checkContactsCount();

    const cancelLink = modal.querySelector('.modal__cancel');
    cancelLink.innerText = data.cancelLinkString;
    cancelLink.removeEventListener('click', cancelLink.listener)
    cancelLink.listener = handlers.cancelHandler;
    cancelLink.addEventListener('click', handlers.cancelHandler);

    // Add event listeners
    const form = modal.querySelector('.modal__form');

    const id = clientData ? clientData.id : undefined;

    cancelLink.clientId = id;

    form.removeEventListener('submit', form.listener);
    form.listener = createModalSubmitHandler(handlers.submitHandler, validators, id);
    form.addEventListener('submit', form.listener);

    mainModal.show();
  }

  window.clientsAppRender.hideMainModal = function () {
    mainModal.hide();
  }

  window.clientsAppRender.showDeleteClientModal = function (id, deleteClient) {
    const modal = document.getElementById('delete-modal');
    const confirmButton = modal.querySelector('.modal__save');
    confirmButton.listener = createDeleteClientHandler(id, deleteClient);
    confirmButton.addEventListener('click', confirmButton.listener);

    deleteModal.show();
  }

  function renderContactLinks(contacts, renderAllContacts = false) {
    const linksArray = [];
    for(const [key, contact] of contacts.entries()) {
      if(!renderAllContacts && contacts.length > (MAX_CONTACTS_VISIBLE + 1) && key >= MAX_CONTACTS_VISIBLE) {
        linksArray.push(renderContactsEtcLink(contacts));
        break;
      }
      linksArray.push(renderContactLink(contact));
    }

    return linksArray;
  }

  function renderClientRow(data, handlers) {
    const row = htmlToElement(`
      <tr class="clients__row">
        <td class="clients__td">
          <span class="clients__id">
            ${data.id}
          </span>
        </td>
        <td class="clients__td">
          ${data.surname} ${data.name} ${data.lastName ? data.lastName : ''}
        </td>
        <td class="clients__td">
          <span class="date">
            <span class="date__date">
              ${getDate(data.createdAt)}
            </span>
            <span class="date__time">
              ${getTime(data.createdAt)}
            </span>
          </span>
        </td>
        <td class="clients__td">
          <span class="date">
            <span class="date__date">
            ${getDate(data.updatedAt)}
            </span>
            <span class="date__time">
            ${getTime(data.updatedAt)}
            </span>
          </span>
        </td>
        <td class="clients__td">
          <div class="clients__contacts">
          </div>
        </td>
        <td class="clients__td">
          <div class="clients__action">
            <button class="clients__edit edit action clear-button">
              <img class="action__icon" src="images/edit.svg" alt="">
              <img class="action__icon action__load" src="images/load.svg" alt="">
              Изменить
            </button>
            <button class="clients__delete delete action clear-button">
              <img class="action__icon" src="images/delete.svg" alt="">
              Удалить
            </button>
          </div>
        </td>
      </tr>
    `);

    // Add contact links
    const contactsDiv = row.querySelector('.clients__contacts');
    contactsDiv.innerHTML = '';
    const contactLinks = renderContactLinks(data.contacts);
    for(const contactLink of contactLinks) {
      contactsDiv.append(contactLink);
    }

    // Add event listeners
    const editButton = row.querySelector('.clients__edit');
    editButton.clientId = data.id;
    const deleteButton = row.querySelector('.clients__delete');
    deleteButton.clientId = data.id;
    editButton.addEventListener('click', handlers.editHandler);
    deleteButton.addEventListener('click', handlers.deleteHandler);

    return row;
  }

  function renderContactsEtcLink(contacts) {
    const etcLink = htmlToElement(`
      <a class="clients__contact contact-link" href="" aria-label="Показать остальные контакты">
        <div class="clients__contact-etc contact-link__etc clients__contact svg">
          +${contacts.length - 4}
        </div>
      </a>
    `)

    etcLink.addEventListener('click', createShowAllContactsHandler(contacts));
    return etcLink;
  }

  function renderContactLink(contactData) {
    const contactLink = htmlToElement(`
      <a class="clients__contact contact-link">
        <img class="contact-link__icon svg">
      </a>
    `);

    const icon = contactLink.querySelector('.contact-link__icon');

    icon.src = contactTypeDOMData[contactData.type].src;
    icon.alt = contactTypeDOMData[contactData.type].alt;
    contactLink.href = contactTypeDOMData[contactData.type].href + contactData.value;

    if(contactData.type === 'other') {
      contactLink.href = '';

      contactLink.contact = contactData.value;
      contactLink.addEventListener('click', copyToClipboard);
      contactLink.addEventListener('keypress', (event) => {
        if(event.key === 'Enter') copyToClipboard(event);
      })
    }

    const tooltipMessage = contactTypeDOMData[contactData.type].tooltip(contactData.value);
    contactLink.setAttribute('aria-description', contactData.value);

    // Add tooltip
    tippy(contactLink, {
      content: tooltipMessage, 
      allowHTML: true,
    });

    return contactLink;
  }

  function copyToClipboard(event) {
    event.preventDefault();

    let text = event.currentTarget.contact;
    navigator.clipboard.writeText(text);
  }

  function renderContact(contactData) {
    const contact = htmlToElement(`
      <div class="contacts__contact contact">
        <select class="contact__select contact-select" aria-label="Выберите тип контакта">
          <option value="phone">
          Телефон
          </option>
          <option value="email">
          Email
          </option>
          <option value="vk">
          Vk
          </option>
          <option value="facebook">
          Facebook
          </option>
          <option value="other">
          Другое
          </option>
        </select>
        <input class="contact__input primary-input input-required" type="text" placeholder="${getCurrentContactPlaceholder()}" aria-label="Введите данные контакта">
        <button class="contact__delete clear-button" type="button" aria-label="Удалить контакт">
          <svg class="contact__delete-icon" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <g clip-path="url(#clip0_224_6681)">
            <path d="M8 2C4.682 2 2 4.682 2 8C2 11.318 4.682 14 8 14C11.318 14 14 11.318 14 8C14 4.682 11.318 2 8 2ZM8 12.8C5.354 12.8 3.2 10.646 3.2 8C3.2 5.354 5.354 3.2 8 3.2C10.646 3.2 12.8 5.354 12.8 8C12.8 10.646 10.646 12.8 8 12.8ZM10.154 5L8 7.154L5.846 5L5 5.846L7.154 8L5 10.154L5.846 11L8 8.846L10.154 11L11 10.154L8.846 8L11 5.846L10.154 5Z" fill="#B0B0B0"/>
            </g>
            <defs>
            <clipPath id="clip0_224_6681">
            <rect width="16" height="16" fill="white"/>
            </clipPath>
            </defs>
          </svg>
        </button>
      </div>
    `);

    const select = contact.querySelector('.contact__select');
    select.value = contactData.type;
    setInputMask(select);
    select.addEventListener('change', contactSelectChangedHandler);

    new Choices(select, {
      allowHTML: true,
      searchEnabled: false,
      placeholder: true,
      shouldSort: false,
      itemSelectText: "",
      // labelId: "gallery-left__filter-name", 

      classNames: {
        containerOuter: 'contact__select contact-select',
        containerInner: 'contact-select__inner',
        listSingle: 'contact-select__single', 
        list: 'contact-select__list', 
        item: 'contact-select__item', 
        itemChoice: 'contact-select__choice', 
        // listDropdown: 'contact-select__dropdown', 
        itemSelectable: 'contact-select__selectable', 
      },
    });

    const input = contact.querySelector('.contact__input');
    input.value = contactData.value;

    const deleteButton = contact.querySelector('.contact__delete');
    deleteButton.addEventListener('click', removeContact);

    deleteButton.tippyInstance = tippy(deleteButton, {
      content: 'Удалить контакт', 
    });

    return contact;
  }

  function getCurrentContactPlaceholder() {
    if(window.innerWidth <= 575) {
      return "Введите данные";
    } else {
      return "Введите данные контакта";
    }
  }

  function renderTooltipHighlight(string) {
    return `<span class="tippy-box__highlight">${string}</span>`;
  }

  function createShowAllContactsHandler(contacts) {
    return function (event) {
      event.preventDefault();

      const contactsDiv = this.parentElement;
      contactsDiv.innerHTML = '';
      const contactLinks = renderContactLinks(contacts, true);
      for(const contactLink of contactLinks) {
        contactsDiv.append(contactLink);
      }
    }
  }

  function createSetSortHandler(setSort) {
    return function () {
      const isReverse = setSort(this.dataset.field);

      currentSortLink.classList.remove('sort_set_reverse');
      currentSortLink.classList.remove('sort_set');

      currentSortLink = this;

      if(!isReverse) {
        this.classList.remove('sort_set_reverse');
        this.classList.add('sort_set');
      }
      else {
        this.classList.remove('sort_set');
        this.classList.add('sort_set_reverse');
      }
    }
  }

  function createModalSubmitHandler(postDataFunction, validators, id) {
    return async function (event) {
      event.preventDefault();

      const resultClient = {};
      resultClient.name = document.getElementById('modal-edit-name').value;
      resultClient.surname = document.getElementById('modal-edit-surname').value;
      resultClient.lastName = document.getElementById('modal-edit-lastname').value;
      resultClient.contacts = getContactsArray(this.querySelector('.contacts'));

      // Check validation 
      if(!checkMainFormValidation(validators)) {
        return;
      }

      const modal = document.getElementById('main-modal');
      setModalLoading(modal);

      const responseText = await postDataFunction(resultClient, id);

      unsetModalLoading(modal);

      if(responseText === '') {
        mainModal.hide();
      } else {
        const errorDiv = modal.querySelector('.modal__error');
        errorDiv.innerHTML = responseText;
      }
    }
  }

  function resetMainFormValidation() {
    const form = document.querySelector('.modal__form');

    // Reset inputs
    const inputs = form.querySelectorAll('input');
    for(const input of inputs) {
      input.classList.remove('is-invalid');
    }
    // Reset error messages
    const errorDiv = form.querySelector('.modal__error');
    errorDiv.innerHTML = '';
  }

  function checkMainFormValidation(validators) {
    resetMainFormValidation();

    const form = document.querySelector('.modal__form');

    let isValid = true;

    const formInputs = form.querySelectorAll('.modal__input input');

    for(const input of formInputs) {
      const value = input.value;
      const name = input.dataset.name;
      const required = input.classList.contains('input-required');
      const result = validators.mainInput(value, name, { required });
      if(!result.ok) {
        isValid = false;
        setInputInvalid(input, result.message)
      }
    }

    const contacts = document.querySelectorAll('.contact');

    for(const contact of contacts) {
      const input = contact.querySelector('.contact__input');

      const type = contact.querySelector('.contact__select select').value;
      const value = input.value;
      const required = input.classList.contains('input-required');

      const result = validators.contactInput(type, value, { required });
      if(!result.ok) {
        isValid = false;
        setInputInvalid(input, result.message)
      }
    }

    return isValid;
  }

  function setInputInvalid(input, message) {
    input.classList.add('is-invalid');
    input.focus();

    const modal = input.closest('.modal');
    const errorDiv = modal.querySelector('.modal__error');
    errorDiv.innerHTML += message + '</br>';
  }

  function createDeleteClientHandler(id, deleteClient) {
    return function () {
      deleteClient(id);
      deleteModal.hide();
    }
  }

  function contactSelectChangedHandler() {
    setInputMask(this);
  }

  function setModalLoading(modal) {
    modal.classList.add('modal_loading');
  }

  function unsetModalLoading(modal) {
    modal.classList.remove('modal_loading');
  }

  function newContact () {
    addContact({ type: 'phone', value: '' });
  }

  function addContact(contactData) {
    const newContact = renderContact(contactData);
    const addContactButton = document.querySelector('.contacts__add-button');

    addContactButton.before(newContact)

    checkContactsCount();
  }

  function removeContact() {
    const contact = this.parentElement;

    const deleteButton = contact.querySelector('.contact__delete');
    deleteButton.tippyInstance.hide();

    contact.remove();
    checkContactsCount();
  }

  function checkContactsCount() {
    const contacts = document.querySelectorAll('.contact');
    const addContactButton = document.querySelector('.contacts__add-button');

    if(contacts.length > (MAX_CONTACTS - 1)) {
      addContactButton.classList.add('contacts__add-button_disabled');
    } else {
      addContactButton.classList.remove('contacts__add-button_disabled');
    }
  }

  function setInputMask(select) {
    const contact = select.closest('.contact');
    const input = contact.querySelector('.contact__input');

    switch(select.value) {
      case 'phone':
        const phoneMask = new Inputmask('+9 (999) 999-99-99');
        phoneMask.mask(input);
        break;
      case 'email':
        const mailMask = new Inputmask('email');
        mailMask.mask(input);
        break;
      default:
        if(input.inputmask) input.inputmask.remove();
    }
  }

  function getContactsArray(container) {
    const contacts = container.querySelectorAll('.contact');
    const contactsArray = [];

    for(const contact of contacts) {
      const type = contact.querySelector('.contact__select .choices__input').value;
      const value = contact.querySelector('.contact__input').value;
      contactsArray.push({ type, value });
    }

    return contactsArray;
  }

  function htmlToElement(html) {
    var template = document.createElement('template');
    html = html.trim(); // Never return a text node of whitespace as the result
    template.innerHTML = html;
    return template.content.firstChild;
  }

  function getDate(dateString) {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();

    return `${day}.${month}.${year}`;
  }

  function getTime(dateString) {
    const date = new Date(dateString);
    return `${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
  }

})();
