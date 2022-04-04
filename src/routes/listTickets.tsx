import { useEffect, useState } from "react";
import { XrplClient } from "xrpl-client"

const client = new XrplClient();

export default function ListTickets(props: any) {

    const [tickets, setTickets] = useState([]);

    useEffect(() => {
        client.send({
            command: "account_objects",
            account: props.user?.account,
        }).then(tickets => {
            const accountObjects = tickets.account_objects.filter((ticket: any) => {
                return ticket.LedgerEntryType === 'Ticket'
            })
            setTickets(accountObjects);

        });
    }, [props.user])

    return (
        <div>
            <h1 className="text-blue-500">Test</h1>
            <ul>
                {tickets?.map((ticket: any) => {
                    return <li className="ticket" key={ticket.index}>
                        Ticket {ticket.TicketSequence} <button onClick={() => props.deleteTicket(ticket.TicketSequence)}>x</button>
                    </li>
                })}
            </ul>
        </div>
    )

}