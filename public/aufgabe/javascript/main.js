"use strict";

window.onload = start;

async function start() {
    printDate();
    window.setInterval(printDate, 1000);
    await showUser();
    await appendData();
    await showSharePrice();
    await showShares();
    let buy = document.querySelector('.buy');
    buy.addEventListener('click', buyAction);
    let sell = document.querySelector('.sell')
    sell.addEventListener('click', sellAction)
}

function printDate() {
    document.getElementById("date").innerHTML = new Date().toDateString();
}

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

async function showUser() {
    let user = await getName();
    let balance = await getBalance();
    document.getElementById("userName").innerText = "Benutzername: " + user;
    document.getElementById("balance").innerText = "Kontostand: " + balance + " $";
}

async function fetchShares() {
    const response = await fetch('/data/aktien');
    return await response.json();
}

// Gibt den Aktienkurs in dem Canvas 'myChart' aus
async function showSharePrice() {
    let context = document.getElementById("myChart").getContext('2d');
    /** Alle Namen der Aktien holen **/
    let sales = await fetchShares();
    let labels = sales.map(function (e) {
        return e.name;
    });
    //Alle Preise der Aktien holen
    let data = sales.map(function (e) {
        return e.preis;
    });
    //Aktienkursdarstellung konfigurieren
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
                        // min: 0
                        // max: 300,
                        beginAtZero: true
                        //stepSize: 30
                    }
                }]
            }
        }
    };
    let chart = new Chart(context, config);
    console.log(chart.data.datasets[0].data)

    async function updateDate() {
        sales = await fetchShares();
        let updateData = sales.map(function (e) {
            return e.preis;
        })
        chart.data.datasets[0].data = updateData;
        console.log(chart.data.datasets[0].data);
        chart.update()
    }

    window.setInterval(updateDate, 1000);
}

async function showShares() {
    const shareList = document.querySelector(".shares-list");
    let shares = await fetchShares();
    shares.forEach(function (share) {
        const shareDiv = document.createElement("div");
        shareDiv.classList.add("share");
        const newShare = document.createElement("li");
        newShare.innerText = share.name;
        const newShareNum = document.createElement("input");
        newShareNum.type = "number";
        newShareNum.min = "1";
        newShareNum.max = share.anzahlVerfuegbar;
        newShareNum.value = "1";
        shareDiv.appendChild(newShare);
        shareDiv.appendChild(newShareNum);
        shareList.appendChild(shareDiv);
    })
    console.log(shares);
}

async function buyAction() {
    let name;
    let quantity;
    if (document.getElementById("microsoft").checked) {
        name = document.getElementById("microsoft").value;
        quantity = document.getElementById("microsoftNumber").value;
    }
    if (document.getElementById("apple").checked) {
        name = document.getElementById("apple").value;
        quantity = document.getElementById("appleNumber").value;
    }
    if (document.getElementById("niantic").checked) {
        name = document.getElementById("niantic").value;
        quantity = document.getElementById("nianticNumber").value;
    }
    if (document.getElementById("amd").checked) {
        name = document.getElementById("amd").value;
        quantity = document.getElementById("amdNumber").value;
    }
    if (document.getElementById("intel").checked) {
        name = document.getElementById("intel").value;
        quantity = document.getElementById("intelNumber").value;
    }
    if (document.getElementById("facebook").checked) {
        name = document.getElementById("facebook").value;
        quantity = document.getElementById("facebookNumber").value;
    }

    let action = {
        "aktie": {
            name: name
        },
        anzahl: quantity
    }
    let response = await fetch("/data/umsaetze", {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json;charset=utf-8'
        },
        body: JSON.stringify(action)
    });
}

async function sellAction() {
    let name;
    let quantity;
    if (document.getElementById("microsoft").checked) {
        name = document.getElementById("microsoft").value;
        quantity = document.getElementById("microsoftNumber").value;
    }
    if (document.getElementById("apple").checked) {
        name = document.getElementById("apple").value;
        quantity = document.getElementById("appleNumber").value;
    }
    if (document.getElementById("niantic").checked) {
        name = document.getElementById("niantic").value;
        quantity = document.getElementById("nianticNumber").value;
    }
    if (document.getElementById("amd").checked) {
        name = document.getElementById("amd").value;
        quantity = document.getElementById("amdNumber").value;
    }
    if (document.getElementById("intel").checked) {
        name = document.getElementById("intel").value;
        quantity = document.getElementById("intelNumber").value;
    }
    if (document.getElementById("facebook").checked) {
        name = document.getElementById("facebook").value;
        quantity = document.getElementById("facebookNumber").value;
    }

    let action = {
        "aktie": {
            name: name
        },
        anzahl: -quantity
    }
    let response = await fetch("/data/umsaetze", {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json;charset=utf-8'
        },
        body: JSON.stringify(action)
    });
}

async function appendData() {
    const umsatz = await fetchUmsatz();
    console.log(umsatz);
    const container = document.getElementById("action");
    umsatz.forEach(function (e) {
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

async function fetchUmsatz() {
    const response = await fetch("/data/umsaetze");
    return await response.json();
}
