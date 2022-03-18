import React, { useEffect, useState } from 'react';
import { XummSdkJwt } from 'xumm-sdk';
import './App.css';
import * as dotenv from "dotenv";
import { AnyJson, XummJsonTransaction } from 'xumm-sdk/dist/src/types';
import { XrplClient } from 'xrpl-client';

dotenv.config();

const Sdk = new XummSdkJwt('8b57456f-fb8e-4699-a66c-989253d361d5');
const client = new XrplClient();

function App() {
  const [user, setUser] = useState<AnyJson>();
  const [tickets, setTickets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Sdk.getOttData().then((c: any) => {
      setUser(c.account_info);
    }).catch(e => {
      console.log('error', e);
    })
  }, [])

  fetchObjects();

  function fetchObjects() {
    if (!user?.account) return;
    client.send({
      command: "account_objects",
      account: user?.account,
    }).then(tickets => {
      if (tickets && tickets.length === 0) return;
      const accountObjects = tickets.account_objects.filter((ticket: any) => {
        return ticket.LedgerEntryType === 'Ticket'
      })
      setTickets(accountObjects);
      setIsLoading(false);
      return true;
    });
  }

  const deleteTicket = (sequence: Number) => {
    let txJson: XummJsonTransaction = { "TransactionType": "AccountSet" };
    setIsLoading(true);
    if (user && user.account) {
      txJson = {
        "TransactionType": "AccountSet",
        "Account": user?.account || '',
        "Sequence": 0,
        "TicketSequence": sequence
      }
    }

    Sdk.payload.create(txJson).then((response) => {
      const wsStatus = response?.refs.websocket_status || '';
      const uuid = response?.uuid || '';
      const ws = new WebSocket(wsStatus);
      ws.onmessage = function (event: any) {
        const data = JSON.parse(event.data);
        if (response?.uuid && data.signed) {
          const payloadStatus = Sdk.payload.get(uuid);
          payloadStatus.then(r => {
            if (data.signed === true && r?.meta.resolved === true) {
              fetchObjects();
            }
          });
        }


      }

      if (typeof (window as any).ReactNativeWebView !== 'undefined') {
        (window as any).ReactNativeWebView.postMessage(JSON.stringify({
          command: 'openSignRequest',
          uuid: response?.uuid
        }))
      }

    });

    return true;
  }


  return (
    <div id="app">
      {isLoading &&
        <div className="loader"></div>
      }
      <ul className="ticketList">
        {tickets.length > 0 && tickets?.map((ticket: any) => {
          return <li className="ticket" key={ticket.index}>
            <div className="ticket__row">
              <div className="ticket__text">
                <span className="ticket__icon"></span>
                <span>
                  Ticket {ticket.TicketSequence} <br />
                  <span className="ticket__subtitle">2 XRP reserve</span>
                </span>
              </div> <button onClick={() => deleteTicket(ticket.TicketSequence)}>Delete</button>
            </div>
          </li>
        })}

        {tickets.length === 0 &&
          <li className="ticket ticket--success">
            <div className="ticket__row">
              <span className="ticket__icon"></span> No tickets found
            </div>
          </li>
        }
      </ul>
    </div >
  );
}

export default App;
