import { useEffect, useState } from 'react';
import { XummSdkJwt } from 'xumm-sdk';
import './App.css';
import * as dotenv from "dotenv";
import { AnyJson, XummJsonTransaction } from 'xumm-sdk/dist/src/types';
import { XrplClient } from 'xrpl-client';

dotenv.config();

const url = new URL(window.location.href);
const xAppToken = url.searchParams.get("xAppToken") || '';
const theme = url.searchParams.get('xAppStyle') || '';
const Sdk = new XummSdkJwt('8b57456f-fb8e-4699-a66c-989253d361d5', xAppToken);
const client = new XrplClient();

function App() {
  const [user, setUser] = useState<AnyJson>();
  const [tickets, setTickets] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [fetchTickets, setFetchTickets] = useState(false);

  useEffect(() => {
    Sdk.getOttData().then((c: any) => {
      setUser(c.account_info);
    }).catch(e => {
      console.log('error', e);
    })
  }, [])

  useEffect(() => {
    const fetchObjects = () => {
      setIsLoading(true);
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
    fetchObjects();
  }, [user, setTickets, fetchTickets]);

  async function deleteTicket(sequence: Number, e: any) {
    e.preventDefault();
    let txJson: XummJsonTransaction = { "TransactionType": "AccountSet" };

    if (user && user.account) {
      txJson = {
        "TransactionType": "AccountSet",
        "Account": user?.account || '',
        "Sequence": 0,
        "TicketSequence": sequence
      }
    }

    const subscription = await Sdk.payload.createAndSubscribe(txJson, (response) => {
      if (Object.keys(response.data).indexOf('signed') > -1) {
        return response.data;
      } else if (response.data && !response.data.expires_in_seconds && !response.data.opened) {
        if (typeof (window as any).ReactNativeWebView !== 'undefined') {
          (window as any).ReactNativeWebView.postMessage(JSON.stringify({
            command: 'openSignRequest',
            uuid: response?.uuid
          }))
        }
      }
    })

    const resolveData: any = await subscription.resolved;

    if (resolveData?.signed) {
      setFetchTickets(true);
    } else {
      setFetchTickets(false);
    }

    return true;
  }


  return (
    <div id="app" className={theme}>
      {isLoading ? (
        <div className="loader" hidden={!isLoading}></div>
      ) : (
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
                </div> <button onClick={(e) => { setIsLoading(true); deleteTicket(ticket.TicketSequence, e) }}>Delete</button>
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
      )}
    </div >
  );
}

export default App;
