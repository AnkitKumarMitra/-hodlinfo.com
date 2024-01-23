document.addEventListener('DOMContentLoaded', () => {
    const purchaseBtn = document.querySelector('.purchase');
    const cost = document.querySelector('.cost');

    purchaseBtn.addEventListener('click', () => {
        const currency = document.querySelector('.currency').value;
        const crypto = document.querySelector('.crypto').value;

        fetch("/get-price", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ currency, crypto }),
        })
            .then(response => response.json())
            .then(data => {
                console.log(data.cost[0]);
                cost.innerHTML = data.cost[0].buy;
            })
            .catch(error => {
                cost.innerHTML = 'Crypto Not Available';
            });
    });

    const darkModeToggle = document.querySelector('.switch input');

    darkModeToggle.addEventListener('change', function () {
        document.body.classList.toggle('dark-theme', darkModeToggle.checked);
    });
});