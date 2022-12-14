import { Box, ButtonBase, Tab, Tabs, Tooltip } from '@mui/material';
import classNames from 'classnames';
import currency from 'currency.js';
import { ethers } from 'ethers';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import ViewHistoryIcon from 'src/components/Icon/ViewHistoryIcon';
import LineBreak from 'src/components/LineBreak';
import DepositComponent from 'src/components/Modal/DepositModal/DepositComponent';
import WithdrawComponent from 'src/components/Modal/WithdrawModal/WithdrawComponent';
import Table from 'src/components/Table';
import { ContractAddress, contracts, fromSzabo, fromWei } from 'src/service/connectSM';
import { fetchBaseToken, fetchOverview, fetchUserInfo, setSelectedAddress } from 'src/store/contract';
import { openModal } from 'src/store/modal';
import ModalTypes from 'src/store/modal/ModalTypes';
import { fetchUser } from 'src/store/userInfo';

function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`vertical-tabpanel-${index}`}
      aria-labelledby={`vertical-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const Automation = () => {
  const dispatch = useDispatch();

  const [value, setValue] = useState(0);

  const contractOverviews = useSelector((state) => state.contract.overview);
  const userInfo = useSelector((state) => state.contract.userInfo);
  const account = useSelector((state) => state.user);
  const selectedAddress = useSelector((state) => state.contract.selectedAddress);

  const handleSetSelectedAddress = (address) => {
    dispatch(setSelectedAddress(address));
  };

  useEffect(() => {
    const fetchInfo = async () => {
      contracts.forEach((contract) => {
        dispatch(fetchOverview({ instance: contract.instance, governor: contract.governor, order: contract.order }));
        dispatch(fetchBaseToken(contract.instance));
      });
    };
    dispatch(setSelectedAddress(ContractAddress[0]));
    fetchInfo();
  }, []);

  useEffect(() => {
    if (!account.address) return;
    contracts.forEach((contract) => {
      dispatch(fetchUserInfo(contract.instance));
    });
  }, [account.address]);

  const handleChange = async (event, newValue) => {
    setValue(newValue);
  };

  const connectWallet = async () => {
    dispatch(fetchUser());
  };

  const showHistory = () => {
    dispatch(
      openModal({
        modalType: ModalTypes.HISTORY_MODAL,
      }),
    );
  };
  return (
    <>
      <Tabs
        orientation="horizontal"
        centered
        value={value}
        onChange={handleChange}
        aria-label="Vertical tabs example"
        sx={{ borderRight: 1, borderColor: 'divider' }}
      >
        {Object.values(contractOverviews)
          .sort((a, b) => a.order - b.order)
          .map((contractOverview) => (
            <Tab
              onClick={() => handleSetSelectedAddress(contractOverview.contractAddress)}
              label={contractOverview.fundName}
              key={contractOverview.fundName}
            />
          ))}
      </Tabs>
      {Object.values(contractOverviews)
        .sort((a, b) => a.order - b.order)
        .map((contractOverview, index) => (
          <TabPanel value={value} index={index} key={contractOverview.fundName}>
            <div className="flex gap-10">
              <div className="w-4/12">
                <div>
                  <div className=" text-white mb-3 font-bold text-lg">Overview</div>

                  <div className="flex items-center my-3">
                    <div className="w-52 text-gray-300 mr-3">Total supply:</div>
                    <div className=" text-white font-bold">
                      {currency(fromWei(ethers.BigNumber.from(contractOverview.tokenSupply).toString()), {
                        symbol: '',
                        precision: 6,
                      }).format()}{' '}
                    </div>
                  </div>
                  <div className="flex items-center my-3">
                    <div className="w-52 text-gray-300 mr-3">USD value:</div>
                    <div className=" text-white font-bold">
                      <span className="text-sm text-gray-400">
                        {currency(fromSzabo(ethers.BigNumber.from(contractOverview.usdValue).toString()), {
                          precision: 6,
                        }).format()}
                      </span>
                    </div>
                  </div>
                </div>

                {account.address && (
                  <>
                    <LineBreak />
                    <div>
                      <div className=" text-white mb-3 font-bold">Your Investment</div>

                      <div className="flex items-center my-3">
                        <div className="w-52 text-gray-300 mr-3">Token balance:</div>
                        <div className=" text-white font-bold">
                          {currency(
                            fromWei(ethers.BigNumber.from(userInfo[selectedAddress]?.tokenBalance || 0).toString()),
                            {
                              symbol: '',
                              precision: 6,
                            },
                          ).format()}
                        </div>
                      </div>

                      <div className="flex items-center my-3">
                        <div className="w-52 text-gray-300 mr-3">USD value:</div>
                        <div className=" text-white font-bold">
                          <span className="text-sm text-gray-400">
                            {currency(
                              fromSzabo(ethers.BigNumber.from(userInfo[selectedAddress]?.usdValue || 0).toString()),
                              {
                                precision: 6,
                              },
                            ).format()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {account.address ? (
                  <>
                    <div>
                      <LineBreak />
                      <div className="flex items-center justify-between">
                        <div className=" text-white font-bold text-lg">Deposit to {contractOverview.fundName}</div>
                        <ViewHistoryIcon onClick={showHistory} />
                      </div>

                      <DepositComponent />
                    </div>
                    <div>
                      <LineBreak />
                      <div className=" text-white mb-3 font-bold text-lg">
                        Withdraw tokens from {contractOverview.fundName}
                      </div>
                      <WithdrawComponent />
                    </div>
                  </>
                ) : (
                  <ButtonBase
                    onClick={connectWallet}
                    component="button"
                    className="relative w-full mt-6 text-white bg-main-100 hover:bg-main-200 font-medium rounded-lg text-sm px-5 py-2.5 text-center mr-3 md:mr-0"
                  >
                    Connect wallet
                  </ButtonBase>
                )}
              </div>
              <div className="w-8/12">
                <div className="flex flex-col my-6 ">
                  <div className="text-lg text-white mb-3 font-bold">Portfolio</div>
                  <Table contractOverview={contractOverview} />
                  <div className="mt-6 text-white font-semibold">
                    {contractOverview.fundName} Governor:{' '}
                    <a
                      className="text-blue-500 ml-3"
                      target="_blank"
                      href={`https://polygonscan.com/address/${contractOverview.governor}#writeContract`}
                      rel="noreferrer"
                    >
                      {contractOverview?.governor}
                    </a>
                  </div>
                </div>

                {account.address && (
                  <div>
                    {contractOverview.isPorfolioEngineer ? (
                      <ButtonBase
                        component="button"
                        onClick={() => {
                          toast.info('Feature unimplemented');
                        }}
                        className={classNames(
                          'float-right w-40 mt-6 relative text-white bg-main-100 hover:bg-main-200 font-medium rounded-lg text-sm px-5 py-2.5 text-center mr-3 md:mr-0',
                        )}
                      >
                        Rebalance Pool
                      </ButtonBase>
                    ) : (
                      <Tooltip title="Only the governors can rebalance">
                        <ButtonBase
                          component="button"
                          className={classNames(
                            'float-right w-40 mt-6 relative text-white bg-main-100 hover:bg-main-200 font-medium rounded-lg text-sm px-5 py-2.5 text-center mr-3 md:mr-0',
                            'opacity-50',
                          )}
                        >
                          Rebalance Pool
                        </ButtonBase>
                      </Tooltip>
                    )}
                  </div>
                )}
              </div>
            </div>
          </TabPanel>
        ))}
    </>
  );
};

export default Automation;
