import React, { useState } from 'react';
import { XummSdkJwt } from 'xumm-sdk';
import { XummJsonTransaction } from 'xumm-sdk/dist/src/types';
import './App.css';

const Sdk = new XummSdkJwt('8b57456f-fb8e-4699-a66c-989253d361d5');

function App() {
  const [image, setImage] = useState('');

  Sdk.getOttData().then(c => {
    const request: XummJsonTransaction = {
      "TransactionType": "TicketCreate",
      "Account": c.account_info.account,
      "TicketCount": 10
    }
    console.log(c);

    return false;
  })


  return (
    <div className="App">
      <h1 className="text-3xl font-bold underline">
        Hello world!
        <img src={image} />
      </h1>
    </div>
  );
}

export default App;
