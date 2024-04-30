# skb. CRM system. Backend

REST API for CRM "skb."

## README.md

* en [English](README.md)
* ru [Русский](readme/README.ru.md)

Before launching, make sure you have Node.js version 12 or higher installed.

To launch server go into the backend directory and run `node index`.
To stop the server press `CTRL+C`.

After launch, the server is available on `http://localhost:3000`

## API methods

All methods use JSON for request and response data.

* `GET /api/clients` - get a list of clients.
  Parameters passed in URL:
  * `search={search string}` - search query, when passed method returns clients
    whose full name or value of one of contacts contains the search string
    inside of it.
* `POST /api/clients` - create a new client. Inside the body you have to pass
  client object. Body of successfully processed request will contain object
  with created client.
* `GET /api/client/{id}` - get client data by their ID. Successful response
  body will contain client object.
* `PATCH /api/client/{id}` - edit client with ID data. Successful response
  body will contain client object with updated data.
* `DELETE /api/client/{id}` - delete client with passed ID.

## Client object structure

```javascript
{
  /*
    Client ID, created by server automatically, it's not possible to
    change it
  */
  id: '1234567890',
  /*
    Date and time of client creation, created by server automatically,
    can't be changed
  */
  createdAt: '2021-02-03T13:07:29.554Z',
  /*
    Date and time of client data update, created by server automatically,
    can't be changed
  */
  updatedAt: '2021-02-03T13:07:29.554Z',
  // * Required field, client name
  name: 'John',
  // * Required field, client surname
  surname: 'Smith',
  // Optional field, client middle name
  lastName: 'Peterson',
  // Contacts - optional field, contacts array
  /*
    Every object in array (if it's passed) should contain
    non-empty properties type and value
  */
  contacts: [
    {
      type: 'phone',
      value: '+71234567890'
    },
    {
      type: 'email',
      value: 'abc@xyz.com'
    },
    {
      type: 'facebook',
      value: 'https://facebook.com/vasiliy-pupkin-the-best'
    }
  ]
}
```

## Possible response status codes

Server response can contain one of this response statuses:

* `200` - request processed successfully
* `201` - request successfully processed and header Location contains
  link to created resource
* `404` - Requested method or resource is not found
* `422` - object passed in body didn't pass validation. Response body
  contains array with validation error descriptions:

  ```javascript
  [
    {
      field: 'Object field name, which triggered error',
      message: 'Error message, which can be shown to user'
    }
  ]
  ```

* `500` - Server error
