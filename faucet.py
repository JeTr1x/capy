import requests

proxies = {
    "http": 'socks5://Ec7ut7:yZaHaf9uG6eb@89.208.199.134:12899',
    "https": 'socks5://Ec7ut7:yZaHaf9uG6eb@89.208.199.134:12899'
}

#'socks5://urUk1A:hUDYduF4SAua@89.208.222.43:12943',

# sess = requests.Session()
# adapter = requests.adapters.HTTPAdapter(max_retries = 20)
# sess.mount('http://', adapter)

# chng = requests.get("https://getproxy.io/change-ip/6d4006fa7a8f731239bd91111249dc96af1cf009")
# print(chng)
def check_proxy():

    try:
        print("Proxy start")
        resp = requests.get("http://ifconfig.me/ip", proxies=proxies)
        print("IP is {}".format(resp.text.strip()))
    except Exception as e:
        print(e)

check_proxy()


fjs = {"FixedAmountRequest":{"recipient":"x364f20a1c4b2fbdff756f1f9ed84ebfaeacce9052a65ae6e8eaf41e660f6431b"}}
faucet = requests.post("https://faucet.testnet.sui.io/gas", json=fjs, proxies=proxies)
print(faucet)

