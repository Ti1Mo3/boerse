"use strict";

window.onload = start;

async function start() {
    printDate();
    window.setInterval(printDate, 1000);
    await getUser();
    await handleShares();
    await updateNotifications();
    window.setInterval(updateNotifications, 1000);
}

/**
 * prints the current Date
 */
function printDate() {
    document.getElementById("date").innerHTML = new Date().toDateString();
}

/**
 * Prints the data of the current user
 * @returns {Promise<void>}
 */
async function getUser() {
    let user = await getName();
    let balance = await getBalance();
    document.getElementById("userName").innerText = "Benutzername: " + user;
    document.getElementById("balance").innerText = "Kontostand: " + balance + " $";

    async function getName() {
        /** Ask the server information **/
        const response = await fetch('/data/benutzerdaten');
        /** Get the Json format of the object from Server**/
        const jsonResponse = await response.json();
        return jsonResponse.name;
    }

    async function getBalance() {
        /** Ask the server information **/
        const response = await fetch('/data/benutzerdaten');
        /** Get the Json format of the object from Server**/
        const jsonResponse = await response.json();
        return jsonResponse.kontostand.toFixed(2);

    }
}


async function updateNotifications() {


    const messageContainer = document.querySelector(".notifications-list");
    // settings for displaying the current notifications and enabling paging
    let curNotifications = {
        'notifications': await fetchNotifications(),
        'page': 1,
        'rows': 10
    };
    // gets the data for pagination (gets updated everytime a user buys/sells a share)
    let data = pagination(curNotifications.notifications, curNotifications.page, curNotifications.rows);
    data.notifications.forEach(function (notification) {
        displayNotification(notification);
    });
    pageButtons(data.pages);

    /**
     * prints the current notification
     * @param notification
     * @returns {Promise<void>}
     */
    async function displayNotification(notification) {
        if (notification !== undefined) {
            let message = document.createElement("div");
            message.innerText = notification.uhrzeit + " " + notification.text;
            messageContainer.appendChild(message);
        }
    }
    /**
     * trims the notifications-list for paging
     * @param notifications current notifications
     * @param page current page
     * @param rows count of rows
     */
    function pagination(notifications, page, rows) {
        let trimStart = (page - 1) * rows;
        let trimEnd = trimStart + rows;
        let trimmedData = notifications.slice(trimStart, trimEnd);
        let pages = Math.ceil(notifications.length / rows);
        return {
            'notifications': trimmedData,
            'page': curNotifications.page,
            'pages': pages
        };
    }

    /**
     * updates the List of notifications, if a new Notification has to be added
     * @returns {Promise<void>}
     */
    data = pagination(curNotifications.notifications, curNotifications.page, curNotifications.rows);
    messageContainer.innerHTML = "";
    data.notifications.forEach(function (notification) {
        displayNotification(notification);
    });
    pageButtons(data.pages);

    /**
     * creates the buttons for scrolling through the pages of the notifications
     * @param pages
     */
    function pageButtons(pages) {
        const pageDiv = document.createElement("div");
        pageDiv.classList.add("pagination-wrapper");

        for (let page = 1; page <= pages; page++) {
            const button = document.createElement("button");
            button.classList.add("page-button");
            if (page === data.page) {
                button.classList.toggle("cur-page");
            }
            button.innerText = page.toString();

            button.addEventListener("click", async function () {
                curNotifications.page = page;
                await updateNotifications();
            });
            pageDiv.appendChild(button);
        }
        messageContainer.appendChild(pageDiv);
    }
}

/**
 * prints the current share prices and handles the buy and sell functions
 * @returns {Promise<void>}
 */
async function handleShares() {
    const container = document.getElementById("share");
    const shareList = document.querySelector(".shares-list");
    const buy = document.querySelector('.buy');
    const sell = document.querySelector('.sell')
    /* state with the current share that the user has chosen to buy / sell
       starts with initial value: null */
    let state = {
        'target': null
    };


    // Event Listeners
    buy.addEventListener("click", buyAction);
    sell.addEventListener("click", sellAction);
    // prints the current sales of the user in a table
    await printSales();
    // prints the current share prices in a chart
    await showSharePrice();
    // prints the currently available shares for buying / selling
    await showShares();
    // prints the ranking of the users
    await displayRanking();

    /**
     * prints the current sales of the user in a table
     * @returns {Promise<void>}
     */
    async function printSales() {
        const sales = await fetchSales();
        sales.forEach(function (e) {
            let tr = document.createElement("tr");
            let name = tr.insertCell();
            let price = tr.insertCell();
            let quantity = tr.insertCell()
            name.innerHTML = e.aktie.name;
            price.innerHTML = e.aktie.preis + "$";
            quantity.innerHTML = e.anzahl;
            container.appendChild(tr)
        });
    }

    /**
     * Outputs the share price in the 'myChart' canvas
     * @returns {Promise<void>}
     */
    async function showSharePrice() {
        let context = document.getElementById("myChart").getContext('2d');
        // Gets all the names of the stocks
        let sales = await fetchShares();
        let labels = sales.map(function (e) {
            return e.name;
        });
        // Gets all the prices of the stocks
        let data = sales.map(function (e) {
            return e.preis;
        });
        // Configures stock price display
        let config = {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Graph line',
                    data: data,
                    borderColor: 'rgb(73,153,202)',
                    backgroundColor: 'rgba(236, 241,241, 0)',
                }],
            },
            options: {
                scales: {
                    yAxes: [{
                        ticks: {

                            beginAtZero: true
                        }
                    }]
                }
            }
        };
        let chart = new Chart(context, config);

        /**
         * updates the Data in chart in every one second
         * @returns {Promise<void>}
         */
        async function updateData() {
            sales = await fetchShares();
            chart.data.datasets[0].data = sales.map(function (e) {
                return e.preis;
            });
            chart.update()
        }

        window.setInterval(updateData, 1000);
    }

    /**
     * prints the shares for buying-/ and selling
     * @returns {Promise<void>}
     */
    async function showShares() {
        let shares = await fetchShares();
        shares.forEach(function (share) {
            const shareDiv = document.createElement("div");
            shareDiv.classList.add("share");
            const newShare = document.createElement("button");
            newShare.innerText = share.name;
            const newShareNum = document.createElement("input");
            newShareNum.type = "number";
            newShareNum.min = "1";
            newShareNum.max = share.anzahlVerfuegbar;
            newShareNum.value = "1";
            shareDiv.appendChild(newShare);
            shareDiv.appendChild(newShareNum);
            shareList.appendChild(shareDiv);
        });
        shareList.addEventListener("click", toggleButton);
    }

    /**
     * highlights the currently clicked "share-button"
     * @param e event
     * @returns {Promise<void>}
     */
    async function toggleButton(e) {
        const button = e.target;
        if (button.type === "submit") {
            if (state.target !== null) {
                state.target.parentElement.classList.toggle("chosenShare");
            }
            state.target = button;
            button.parentElement.classList.toggle("chosenShare");
        } else if (button.type === "number") {
            if (state.target !== null) {
                state.target.parentElement.classList.toggle("chosenShare");
            }
            state.target = button.previousSibling;
            button.parentElement.classList.toggle("chosenShare");
        }
    }

    /**
     * function for buying shares
     * @returns {Promise<void>}
     */
    async function buyAction() {
        const share = state.target;
        if (share !== null) {
            let name = share.innerText;
            let quantity = share.nextSibling.value;
            let action = {
                "aktie": {
                    "name": name
                },
                "anzahl": quantity
            };
            if (quantity == 0) {
                window.alert("Null Aktien können nicht gekauft werden");
            } else {
                const response = await fetch("/data/umsaetze", {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json;charset=utf-8'
                    },
                    body: JSON.stringify(action)
                });
                if (response.ok == false) {
                    window.alert("Nicht genügend Aktien im Markt verfügbar");
                }
            }
            container.innerHTML = "";
            state.target.parentElement.classList.toggle("chosenShare");
            state.target.nextSibling.value = "1";
            state.target = null;
            await printSales();
        }
    }

    /**
     * function for selling shares
     * @returns {Promise<void>}
     */
    async function sellAction() {
        const share = state.target;
        if (share !== null) {
            let name = share.innerText;
            let quantity = share.nextSibling.value;
            let action = {
                "aktie": {
                    "name": name
                },
                "anzahl": -quantity
            }
            if (quantity == 0) {
                window.alert("Null Aktien können nicht verkauft werden");
            } else {
                const response = await fetch("/data/umsaetze", {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json;charset=utf-8'
                    },
                    body: JSON.stringify(action)
                });
                if (response.ok == false) {
                    window.alert("Zu wenige Aktien für Verkauf im Depot.");
                }
            }

            container.innerHTML = "";
            state.target.parentElement.classList.toggle("chosenShare");
            state.target = null;
            await printSales();
        }
    }


    /**
     * prints the table with the ranking of the users
     * @returns {Promise<void>}
     */
    async function displayRanking() {
        const container = document.getElementById("rankList");
        let ranking = await fetchRanking();
        // sort the rankArray ascending
        let sortedRankArray = ranking.sort(compare);
        // fills the table with values
        sortedRankArray.forEach(function (rank) {
            let tr = document.createElement("tr");
            let name = tr.insertCell();
            let price = tr.insertCell();
            name.innerHTML = rank.name;
            price.innerHTML = rank.summe.toFixed(2) + " $";
            container.appendChild(tr);
        });
        await updateRanking();
        window.setInterval(updateRanking, 1000);

        /**
         * updates the Ranking of the users depending on the share prices
         * @returns {Promise<void>}
         */
        async function updateRanking() {
            let table = document.getElementById("rank");
            const updateContainer = document.getElementById("rankList");
            let ranking = await fetchRanking();
            // sort the rankArray ascending
            let sortedRankArray = ranking.sort(compare);
            // Deletes the old Rows
            let rowCount = table.rows.length;
            let i;
            for (i = rowCount - 1; i > 0; i--) {
                table.deleteRow(i);
            }
            // fills the table with the new values
            sortedRankArray.forEach(function (rank) {
                let tr = document.createElement("tr");
                let name = tr.insertCell();
                let price = tr.insertCell();
                name.innerHTML = rank.name;
                price.innerHTML = rank.summe.toFixed(2) + " $";
                updateContainer.appendChild(tr);
            });
        }

        /**
         * Sorts the Array ascending of the price
         * @param a
         * @param b
         * @returns {number}
         */
        function compare(a, b) {
            if (a.summe < b.summe) {
                return 1;
            }
            if (a.summe > b.summe) {
                return -1;
            }
            return 0;
        }
    }
}

/**
 * gets the sales of the user
 * @returns {Promise<any>}
 */
async function fetchSales() {
    const response = await fetch("/data/umsaetze");
    return await response.json();
}

/**
 * gets the available shares
 * @returns {Promise<any>}
 */
async function fetchShares() {
    try {
        const response = await fetch('/data/aktien');
        return await response.json();
    } catch (ERR_CONNECTION_REFUSED) {
        window.alert("There are problems with server, please restart it");
    }
}

/**
 * gets the current notifications
 * @returns {Promise<any>}
 */
async function fetchNotifications() {
    const response = await fetch('/data/nachrichten');
    return await response.json();
}

/**
 * Get the ranking list
 * @returns {Promise<any>}
 */
async function fetchRanking() {
    const response = await fetch('/data/depotAlle');
    return await response.json();
}