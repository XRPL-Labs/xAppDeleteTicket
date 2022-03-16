import React, { useEffect, useState } from 'react';
import { XummSdkJwt } from 'xumm-sdk';
import './App.css';
import * as dotenv from "dotenv";
import { Link, Outlet, Route, Routes } from 'react-router-dom';
import ListTickets from './routes/listTickets';
import { AnyJson, XummJsonTransaction } from 'xumm-sdk/dist/src/types';
import { XrplClient } from 'xrpl-client';

dotenv.config();

const Sdk = new XummSdkJwt('8b57456f-fb8e-4699-a66c-989253d361d5');
const client = new XrplClient();

function messageHandler(event: any) {
  // alert(JSON.stringify(event.data));
}

if (typeof window.addEventListener === 'function') {
  window.addEventListener("message", messageHandler)
}
if (typeof document.addEventListener === 'function') {
  document.addEventListener("message", messageHandler)
}

function App() {
  const [user, setUser] = useState<AnyJson>();

  useEffect(() => {
    Sdk.getOttData().then((c: any) => {
      setUser(c.account_info);
      return false;
    })
  }, [])

  const deleteTicket = (sequence: Number) => {
    let txJson: XummJsonTransaction = { "TransactionType": "AccountSet" };
    if (user && user.account) {
      txJson = {
        "TransactionType": "AccountSet",
        "Account": user?.account || '',
        "Sequence": 0,
        "TicketSequence": sequence
      }
    }

    Sdk.payload.create(txJson).then((response) => {
      if (typeof (window as any).ReactNativeWebView !== 'undefined') {
        (window as any).ReactNativeWebView.postMessage(JSON.stringify({
          command: 'openSignRequest',
          uuid: response?.uuid
        }))
      }
    });

    return true;
  }

  const [tickets, setTickets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    client.send({
      command: "account_objects",
      account: user?.account,
    }).then(tickets => {
      const accountObjects = tickets.account_objects.filter((ticket: any) => {
        return ticket.LedgerEntryType === 'Ticket'
      })
      setTickets(accountObjects);
      setIsLoading(false);

    });
  }, [user])

  return (
    <div id="app" >
      {user?.account &&
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
          </Route>
        </Routes>
      }
      <div>
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
                    Ticket <br />
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
    </div >
  );
}

function Layout() {
  return (
    <div className='font-sans'>
      {/* A "layout route" is a good place to put markup you want to
          share across all the pages on your site, like navigation. */}

      {/* An <Outlet> renders whatever child route is currently active,
          so you can think about this <Outlet> as a placeholder for
          the child routes we defined above. */}
      <Outlet />
    </div>
  );
}

function Home() {
  return (
    <div>
    </div>
  );
}

function About() {
  return (
    <div>
      <h2>About</h2>
    </div>
  );
}

function NoMatch() {
  return (
    <div>
      <h2>Nothing to see here!</h2>
      <p>
        <Link to="/">Go to the home page</Link>
      </p>
    </div>
  );
}


export default App;
