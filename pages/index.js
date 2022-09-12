import { ethers, utils } from 'ethers';
import { useEffect, useState } from 'react';
import { contract } from '../Contracts/contract';
import styles from '../styles/Home.module.css';
import axios from 'axios';
import Records from '../components/Records';
import Image from 'next/image';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Flip } from 'react-toastify';

const COMPLIANCE_ROLE = utils.keccak256(utils.toUtf8Bytes('COMPLIANCE_ROLE'));

export default function Home() {
  const [signer, setSigner] = useState();
  const [connectedAddress, setConnectedAddress] = useState(
    'Wallet not detected'
  );
  const [fieldValue, setFieldValue] = useState('');
  const [sortedArray, setSortedArray] = useState([]);
  const [userRoles, setUserRoles] = useState(['FALSE']);
  const smartContract = new ethers.Contract(
    contract.address,
    contract.abi,
    signer
  );

  useEffect(() => {
    apiCall();
  }, []);

  useEffect(() => connectToMetamask, []);

  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', connectToMetamask);
      window.ethereum.on('chainChanged', connectToMetamask);
    }
  }, []);

  const connectHandler = async () => {
    if (window.ethereum) {
      try {
        const provider = new ethers.providers.Web3Provider(
          window.ethereum,
          'any'
        );

        await provider.send('eth_requestAccounts', []);
        const signer = provider.getSigner();
        const addr = await signer.getAddress();
        setSigner(signer);
        console.log('account: ', addr);
        setConnectedAddress(addr);
      } catch (err) {
        console.error(err);
        alert('There was a problem connecting to MetaMask');
      }
    } else {
      alert('Install MetaMask');
    }
  };

  //fetching all transactions etherscan api
  const apiCall = async () => {
    axios
      .get(
        `https://api-rinkeby.etherscan.io/api?module=account&action=txlist&address=${contract.address}&startblock=0&endblock=99999999&page=1&offset=1000&sort=asc&apikey=${process.env.NEXT_PUBLIC_ETHERSCAN}`
      )
      .then((res) => {
        sortArray(res.data.result);
      });
  };

  //sorting array to remove unfrozen and duplicates
  const sortArray = async (_data) => {
    let tempSortedArray = [];
    _data.map((x) => {
      if (
        x.functionName === 'freeze(address _address)' ||
        x.functionName === 'unfreeze(address _address)'
      ) {
        if (
          tempSortedArray.some(
            (item) =>
              (item.function === x.functionName) &
              (item.address === `0x${x.input.slice(34)}`)
          )
        ) {
        } else {
          tempSortedArray.push({
            function: x.functionName,
            address: `0x${x.input.slice(34)}`,
            // address: x.input,
          });
        }
        if (x.functionName === 'unfreeze(address _address)') {
          const index = tempSortedArray.findIndex((object) => {
            return object.address === `0x${x.input.slice(34)}`;
          });
          tempSortedArray.splice(tempSortedArray.length - 1, 1);
          tempSortedArray.splice(index, 1);
        } else {
        }
        setSortedArray(...[tempSortedArray]);
      }
    });
  };

  //connect to metamask
  const connectToMetamask = async () => {
    try {
      const provider = new ethers.providers.Web3Provider(
        window.ethereum,
        'any'
      );
      await provider.send('eth_requestAccounts', []);
      const signer = provider.getSigner();
      const addr = await signer.getAddress();
      setSigner(signer);
      console.log('account: ', addr);
      setConnectedAddress(addr);
    } catch (err) {
      console.log(err);
    }
  };

  //checking granted roles for user
  const checkRoles = async (_role) => {
    try {
      if (connectedAddress === 'Wallet not detected') {
      } else {
        let hasRole = await smartContract.hasRole(
          COMPLIANCE_ROLE,
          connectedAddress
        );
        if (hasRole) {
          setUserRoles('TRUE');
        }
      }
    } catch (error) {
      console.log(error);
      toast.error(error.reason);
    }
  };

  //freeze address
  const freeze = async () => {
    try {
      let tx = await smartContract.freeze(fieldValue);
      toast.loading('Please wait...');
      setFieldValue('');
      console.log('submitting transaction: ', tx.hash);
      await tx.wait();
      console.log('transaction confirmed', tx);
      toast.dismiss();
      setTimeout(function () {
        apiCall();
      }, 10000);

      apiCall();
      toast.success(`${fieldValue.slice(0, 7)}... Frozen`, { theme: 'dark' });
    } catch (error) {
      console.log(error.reason);
      toast.dismiss();
      toast.error(error.reason, { theme: 'dark' });
    }
  };

  const unFreeze = async () => {
    try {
      let tx = await smartContract.unfreeze(fieldValue);
      toast.loading('Please wait...');
      setFieldValue('');
      console.log('submitting transaction: ', tx.hash);
      await tx.wait();
      console.log('transaction confirmed', tx);
      toast.dismiss();
      setTimeout(function () {
        apiCall();
      }, 8000);

      apiCall();
      toast.success(`${fieldValue.slice(0, 7)}... unFrozen`, { theme: 'dark' });
    } catch (error) {
      console.log(error.reason);
      toast.dismiss();

      toast.error(error.reason, { theme: 'dark' });
    }
  };

  // Check if address is frozen
  const getContractValue = async () => {
    try {
      let valueStored = await smartContract.isAccountFrozen(fieldValue);
      console.log(valueStored);
      if (valueStored) {
        toast.info(`${fieldValue.slice(0, 7)}... is frozen`, { theme: 'dark' });
      } else {
        toast.info(`${fieldValue.slice(0, 7)}... is not frozen`, {
          theme: 'dark',
        });
      }
    } catch (error) {
      console.log(error);
      toast.error(error.reason, { theme: 'dark' });
    }
  };

  checkRoles();

  return (
    <div className={styles.container}>
      <title>STORM</title>
      <main>
        <button onClick={connectHandler}>Connect Wallet</button>
        <ToastContainer transition={Flip} />
        <div className={styles.shape}>
          <div className={styles.appName}>
            <h1>S T O R M . D A S H B O A R D</h1>
          </div>
          <div className={styles.initialisers}>
            <h2>CONTRACT: {contract.address}</h2>
            <h2>USER: {connectedAddress}</h2>
            <h2>COMPLIENCE ROLE: {userRoles}</h2>
          </div>
          <div className={styles.inputSection}>
            <input
              className={styles.inputField}
              type="text"
              value={fieldValue}
              onChange={(e) => setFieldValue(e.target.value)}
              placeholder="ENTER ADDRESS"
            />
            <div className={styles.buttonRack}>
              <button onClick={freeze} className={styles.btnFreeze}>
                FREEZE
              </button>
              <button onClick={getContractValue} className={styles.btnCheck}>
                CHECK IF FROZEN
              </button>
              <button onClick={unFreeze} className={styles.btnUnFreeze}>
                UNFREEZE
              </button>
            </div>
          </div>
          <div className={styles.refreshSection}>
            <button
              onClick={() => {
                const refreshNotification = new Promise((resolve) =>
                  setTimeout(() => resolve(), 1)
                );
                toast.promise(
                  refreshNotification,
                  {
                    pending: {
                      render() {
                        apiCall();
                      },
                    },
                    success: {
                      render() {
                        return `Refreshing`;
                      },
                    },
                  },
                  { theme: 'dark' }
                );
              }}
              className={styles.refresh}
            >
              <Image
                src="/refresh.png"
                alt="Picture of the author"
                width={30}
                height={30}
              />
            </button>
          </div>
          <div className={styles.listSection}>
            <ul className={styles.listShape}>
              <p className={styles.allFrozenTitle}>ALL FROZEN ADDRESSES</p>
              {sortedArray.map(function (item, i) {
                return <Records key={i} data={item?.address} />;
              })}
            </ul>
          </div>
          <div className={styles.footer}>IBNZUK @ 2022 - V0.0.1</div>
        </div>
      </main>
    </div>
  );
}

//0x1791B8a000631815cf33b6Fa37231eD79893B72D
//0x38350A652ea2b1ED1eF9dfC8D75Fb56f298312ca
//0x556ffbbbdec513baaa966cbd5c53b8c13870ffbe
