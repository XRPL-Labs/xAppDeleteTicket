import React, { useEffect, useState } from 'react';
import { XummSdkJwt } from 'xumm-sdk';
import './App.css';
import * as dotenv from "dotenv";
import { Link, Outlet, Route, Routes } from 'react-router-dom';
import ListTickets from './routes/listTickets';
import { AnyJson, XummJsonTransaction } from 'xumm-sdk/dist/src/types';

dotenv.config();

const Sdk = new XummSdkJwt('8b57456f-fb8e-4699-a66c-989253d361d5');

function messageHandler(event: any) {
  alert(JSON.stringify(event.data));
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


  return (
    <div>
      {/* <h1>Basic Example</h1>

      <p>
        This example demonstrates some of the core features of React Router
        including nested <code>&lt;Route&gt;</code>s,{" "}
        <code>&lt;Outlet&gt;</code>s, <code>&lt;Link&gt;</code>s, and using a
        "*" route (aka "splat route") to render a "not found" page when someone
        visits an unrecognized URL.
      </p> */}

      {/* Routes nest inside one another. Nested route paths build upon
            parent route paths, and nested route elements render inside
            parent route elements. See the note about <Outlet> below. */}
      {user?.account &&
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="generate-ticket" element={<About />} />
            <Route path="/list-tickets" element={<ListTickets user={user} deleteTicket={deleteTicket} />} />

            {/* Using path="*"" means "match anything", so this route
                acts like a catch-all for URLs that we don't have explicit
                routes for. */}
            <Route path="*" element={<NoMatch />} />
          </Route>
        </Routes>
      }
    </div>
  );
}

function Layout() {
  return (
    <div className='font-sans'>
      {/* A "layout route" is a good place to put markup you want to
          share across all the pages on your site, like navigation. */}
      <nav>
        <ul>
          <li>
            <Link to="/list-tickets">List Tickets</Link>
          </li>
        </ul>
      </nav>

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
      <h2>Home</h2>
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
