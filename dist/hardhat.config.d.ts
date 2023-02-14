import { HardhatUserConfig } from 'hardhat/config';
import '@nomicfoundation/hardhat-toolbox';
import "@nomicfoundation/hardhat-chai-matchers";
import '@nomiclabs/hardhat-ethers';
import '@typechain/hardhat';
import 'hardhat-circom';
import './tasks/createZKKYC';
declare const config: HardhatUserConfig;
export default config;
