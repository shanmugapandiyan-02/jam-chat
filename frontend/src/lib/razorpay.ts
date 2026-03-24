export const loadRazorpay = () => {
    return new Promise((resolve) => {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => {
            resolve(true);
        };
        script.onerror = () => {
            resolve(false);
        };
        document.body.appendChild(script);
    });
};

export const createPayment = async (amount: number, user: any) => {
    const res = await loadRazorpay();

    if (!res) {
        alert('Razorpay SDK failed to load. Are you online?');
        return;
    }

    // Create order on the server
    const response = await fetch(`${process.env.NEXT_PUBLIC_SOCKET_SERVER_URL}/api/create-order`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ amount, currency: 'INR' }),
    });

    const order = await response.json();

    const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: 'VibeConnect Premium',
        description: 'Upgrade for premium features',
        order_id: order.id,
        handler: async function (response: any) {
            alert('Payment Successful: ' + response.razorpay_payment_id);
            // Here you would call your backend to verify the payment and update the user status
        },
        prefill: {
            name: user.name,
            email: user.email,
        },
        theme: {
            color: '#3b82f6',
        },
    };

    const rzp = new (window as any).Razorpay(options);
    rzp.open();
};
