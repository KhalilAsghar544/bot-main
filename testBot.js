const ganache = require("ganache-core");
const IUniswapV3PoolABI = require("@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Pool.sol/IUniswapV3Pool.json");
const Quoter = require("@uniswap/v3-periphery/artifacts/contracts/lens/Quoter.sol/Quoter.json");
const {
  AlphaRouter,
  SwapOptionsSwapRouter02,
  SwapRoute,
  SwapType,
  NONFUNGIBLE_POSITION_MANAGER_ADDRESS,
} = require("@uniswap/smart-order-router");
const JSBI = require("jsbi");
const QUOTER_CONTRACT_ADDRESS = "0xb27308f9f90d607463bb33ea1bebb41c27ce5ab6";
const {
  CurrencyAmount,
  Percent,
  TradeType,
  Token,
  Price,
} = require("@uniswap/sdk-core");
const {
  Pool,
  SwapQuoter,
  SwapRouter,
  Trade,
  SwapOptions,
  Route,
  Position,
  nearestUsableTick,
  NonfungiblePositionManager,
  computePoolAddress,
  TickMath,
  FullMath,
  priceToClosestTick,
  tickToPrice,
} = require("@uniswap/v3-sdk");

const { ethers, artifacts } = require("hardhat");
const { ChainId, Currency } = require("@uniswap/sdk");
const { BigNumber } = require("ethers");
const { poll } = require("ethers/lib/utils");
const abi = [
  {
    constant: true,
    inputs: [],
    name: "name",
    outputs: [{ name: "", type: "string" }],
    payable: false,
    stateMutability: "view",
    type: "function",
  },
  {
    constant: false,
    inputs: [
      { name: "guy", type: "address" },
      { name: "wad", type: "uint256" },
    ],
    name: "approve",
    outputs: [{ name: "", type: "bool" }],
    payable: false,
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    constant: true,
    inputs: [],
    name: "totalSupply",
    outputs: [{ name: "", type: "uint256" }],
    payable: false,
    stateMutability: "view",
    type: "function",
  },
  {
    constant: false,
    inputs: [
      { name: "src", type: "address" },
      { name: "dst", type: "address" },
      { name: "wad", type: "uint256" },
    ],
    name: "transferFrom",
    outputs: [{ name: "", type: "bool" }],
    payable: false,
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    constant: false,
    inputs: [{ name: "wad", type: "uint256" }],
    name: "withdraw",
    outputs: [],
    payable: false,
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    constant: true,
    inputs: [],
    name: "decimals",
    outputs: [{ name: "", type: "uint8" }],
    payable: false,
    stateMutability: "view",
    type: "function",
  },
  {
    constant: true,
    inputs: [{ name: "", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    payable: false,
    stateMutability: "view",
    type: "function",
  },
  {
    constant: true,
    inputs: [],
    name: "symbol",
    outputs: [{ name: "", type: "string" }],
    payable: false,
    stateMutability: "view",
    type: "function",
  },
  {
    constant: false,
    inputs: [
      { name: "dst", type: "address" },
      { name: "wad", type: "uint256" },
    ],
    name: "transfer",
    outputs: [{ name: "", type: "bool" }],
    payable: false,
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    constant: false,
    inputs: [],
    name: "deposit",
    outputs: [],
    payable: true,
    stateMutability: "payable",
    type: "function",
  },
  {
    constant: true,
    inputs: [
      { name: "", type: "address" },
      { name: "", type: "address" },
    ],
    name: "allowance",
    outputs: [{ name: "", type: "uint256" }],
    payable: false,
    stateMutability: "view",
    type: "function",
  },
  { payable: true, stateMutability: "payable", type: "fallback" },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "src", type: "address" },
      { indexed: true, name: "guy", type: "address" },
      { indexed: false, name: "wad", type: "uint256" },
    ],
    name: "Approval",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "src", type: "address" },
      { indexed: true, name: "dst", type: "address" },
      { indexed: false, name: "wad", type: "uint256" },
    ],
    name: "Transfer",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "dst", type: "address" },
      { indexed: false, name: "wad", type: "uint256" },
    ],
    name: "Deposit",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "src", type: "address" },
      { indexed: false, name: "wad", type: "uint256" },
    ],
    name: "Withdrawal",
    type: "event",
  },
];
const nfpmAbi = [
  {
    inputs: [
      { internalType: "address", name: "_factory", type: "address" },
      { internalType: "address", name: "_WETH9", type: "address" },
      { internalType: "address", name: "_tokenDescriptor_", type: "address" },
    ],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "owner",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "approved",
        type: "address",
      },
      {
        indexed: true,
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
    ],
    name: "Approval",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "owner",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "operator",
        type: "address",
      },
      { indexed: false, internalType: "bool", name: "approved", type: "bool" },
    ],
    name: "ApprovalForAll",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "address",
        name: "recipient",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "amount0",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "amount1",
        type: "uint256",
      },
    ],
    name: "Collect",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint128",
        name: "liquidity",
        type: "uint128",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "amount0",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "amount1",
        type: "uint256",
      },
    ],
    name: "DecreaseLiquidity",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint128",
        name: "liquidity",
        type: "uint128",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "amount0",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "amount1",
        type: "uint256",
      },
    ],
    name: "IncreaseLiquidity",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "from", type: "address" },
      { indexed: true, internalType: "address", name: "to", type: "address" },
      {
        indexed: true,
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
    ],
    name: "Transfer",
    type: "event",
  },
  {
    inputs: [],
    name: "DOMAIN_SEPARATOR",
    outputs: [{ internalType: "bytes32", name: "", type: "bytes32" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "PERMIT_TYPEHASH",
    outputs: [{ internalType: "bytes32", name: "", type: "bytes32" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "WETH9",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "to", type: "address" },
      { internalType: "uint256", name: "tokenId", type: "uint256" },
    ],
    name: "approve",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "owner", type: "address" }],
    name: "balanceOf",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "baseURI",
    outputs: [{ internalType: "string", name: "", type: "string" }],
    stateMutability: "pure",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "tokenId", type: "uint256" }],
    name: "burn",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      {
        components: [
          { internalType: "uint256", name: "tokenId", type: "uint256" },
          { internalType: "address", name: "recipient", type: "address" },
          { internalType: "uint128", name: "amount0Max", type: "uint128" },
          { internalType: "uint128", name: "amount1Max", type: "uint128" },
        ],
        internalType: "struct INonfungiblePositionManager.CollectParams",
        name: "params",
        type: "tuple",
      },
    ],
    name: "collect",
    outputs: [
      { internalType: "uint256", name: "amount0", type: "uint256" },
      { internalType: "uint256", name: "amount1", type: "uint256" },
    ],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "token0", type: "address" },
      { internalType: "address", name: "token1", type: "address" },
      { internalType: "uint24", name: "fee", type: "uint24" },
      { internalType: "uint160", name: "sqrtPriceX96", type: "uint160" },
    ],
    name: "createAndInitializePoolIfNecessary",
    outputs: [{ internalType: "address", name: "pool", type: "address" }],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      {
        components: [
          { internalType: "uint256", name: "tokenId", type: "uint256" },
          { internalType: "uint128", name: "liquidity", type: "uint128" },
          { internalType: "uint256", name: "amount0Min", type: "uint256" },
          { internalType: "uint256", name: "amount1Min", type: "uint256" },
          { internalType: "uint256", name: "deadline", type: "uint256" },
        ],
        internalType:
          "struct INonfungiblePositionManager.DecreaseLiquidityParams",
        name: "params",
        type: "tuple",
      },
    ],
    name: "decreaseLiquidity",
    outputs: [
      { internalType: "uint256", name: "amount0", type: "uint256" },
      { internalType: "uint256", name: "amount1", type: "uint256" },
    ],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [],
    name: "factory",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "tokenId", type: "uint256" }],
    name: "getApproved",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        components: [
          { internalType: "uint256", name: "tokenId", type: "uint256" },
          { internalType: "uint256", name: "amount0Desired", type: "uint256" },
          { internalType: "uint256", name: "amount1Desired", type: "uint256" },
          { internalType: "uint256", name: "amount0Min", type: "uint256" },
          { internalType: "uint256", name: "amount1Min", type: "uint256" },
          { internalType: "uint256", name: "deadline", type: "uint256" },
        ],
        internalType:
          "struct INonfungiblePositionManager.IncreaseLiquidityParams",
        name: "params",
        type: "tuple",
      },
    ],
    name: "increaseLiquidity",
    outputs: [
      { internalType: "uint128", name: "liquidity", type: "uint128" },
      { internalType: "uint256", name: "amount0", type: "uint256" },
      { internalType: "uint256", name: "amount1", type: "uint256" },
    ],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "owner", type: "address" },
      { internalType: "address", name: "operator", type: "address" },
    ],
    name: "isApprovedForAll",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        components: [
          { internalType: "address", name: "token0", type: "address" },
          { internalType: "address", name: "token1", type: "address" },
          { internalType: "uint24", name: "fee", type: "uint24" },
          { internalType: "int24", name: "tickLower", type: "int24" },
          { internalType: "int24", name: "tickUpper", type: "int24" },
          { internalType: "uint256", name: "amount0Desired", type: "uint256" },
          { internalType: "uint256", name: "amount1Desired", type: "uint256" },
          { internalType: "uint256", name: "amount0Min", type: "uint256" },
          { internalType: "uint256", name: "amount1Min", type: "uint256" },
          { internalType: "address", name: "recipient", type: "address" },
          { internalType: "uint256", name: "deadline", type: "uint256" },
        ],
        internalType: "struct INonfungiblePositionManager.MintParams",
        name: "params",
        type: "tuple",
      },
    ],
    name: "mint",
    outputs: [
      { internalType: "uint256", name: "tokenId", type: "uint256" },
      { internalType: "uint128", name: "liquidity", type: "uint128" },
      { internalType: "uint256", name: "amount0", type: "uint256" },
      { internalType: "uint256", name: "amount1", type: "uint256" },
    ],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [{ internalType: "bytes[]", name: "data", type: "bytes[]" }],
    name: "multicall",
    outputs: [{ internalType: "bytes[]", name: "results", type: "bytes[]" }],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [],
    name: "name",
    outputs: [{ internalType: "string", name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "tokenId", type: "uint256" }],
    name: "ownerOf",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "spender", type: "address" },
      { internalType: "uint256", name: "tokenId", type: "uint256" },
      { internalType: "uint256", name: "deadline", type: "uint256" },
      { internalType: "uint8", name: "v", type: "uint8" },
      { internalType: "bytes32", name: "r", type: "bytes32" },
      { internalType: "bytes32", name: "s", type: "bytes32" },
    ],
    name: "permit",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "tokenId", type: "uint256" }],
    name: "positions",
    outputs: [
      { internalType: "uint96", name: "nonce", type: "uint96" },
      { internalType: "address", name: "operator", type: "address" },
      { internalType: "address", name: "token0", type: "address" },
      { internalType: "address", name: "token1", type: "address" },
      { internalType: "uint24", name: "fee", type: "uint24" },
      { internalType: "int24", name: "tickLower", type: "int24" },
      { internalType: "int24", name: "tickUpper", type: "int24" },
      { internalType: "uint128", name: "liquidity", type: "uint128" },
      {
        internalType: "uint256",
        name: "feeGrowthInside0LastX128",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "feeGrowthInside1LastX128",
        type: "uint256",
      },
      { internalType: "uint128", name: "tokensOwed0", type: "uint128" },
      { internalType: "uint128", name: "tokensOwed1", type: "uint128" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "refundETH",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "from", type: "address" },
      { internalType: "address", name: "to", type: "address" },
      { internalType: "uint256", name: "tokenId", type: "uint256" },
    ],
    name: "safeTransferFrom",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "from", type: "address" },
      { internalType: "address", name: "to", type: "address" },
      { internalType: "uint256", name: "tokenId", type: "uint256" },
      { internalType: "bytes", name: "_data", type: "bytes" },
    ],
    name: "safeTransferFrom",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "token", type: "address" },
      { internalType: "uint256", name: "value", type: "uint256" },
      { internalType: "uint256", name: "deadline", type: "uint256" },
      { internalType: "uint8", name: "v", type: "uint8" },
      { internalType: "bytes32", name: "r", type: "bytes32" },
      { internalType: "bytes32", name: "s", type: "bytes32" },
    ],
    name: "selfPermit",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "token", type: "address" },
      { internalType: "uint256", name: "nonce", type: "uint256" },
      { internalType: "uint256", name: "expiry", type: "uint256" },
      { internalType: "uint8", name: "v", type: "uint8" },
      { internalType: "bytes32", name: "r", type: "bytes32" },
      { internalType: "bytes32", name: "s", type: "bytes32" },
    ],
    name: "selfPermitAllowed",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "token", type: "address" },
      { internalType: "uint256", name: "nonce", type: "uint256" },
      { internalType: "uint256", name: "expiry", type: "uint256" },
      { internalType: "uint8", name: "v", type: "uint8" },
      { internalType: "bytes32", name: "r", type: "bytes32" },
      { internalType: "bytes32", name: "s", type: "bytes32" },
    ],
    name: "selfPermitAllowedIfNecessary",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "token", type: "address" },
      { internalType: "uint256", name: "value", type: "uint256" },
      { internalType: "uint256", name: "deadline", type: "uint256" },
      { internalType: "uint8", name: "v", type: "uint8" },
      { internalType: "bytes32", name: "r", type: "bytes32" },
      { internalType: "bytes32", name: "s", type: "bytes32" },
    ],
    name: "selfPermitIfNecessary",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "operator", type: "address" },
      { internalType: "bool", name: "approved", type: "bool" },
    ],
    name: "setApprovalForAll",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "bytes4", name: "interfaceId", type: "bytes4" }],
    name: "supportsInterface",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "token", type: "address" },
      { internalType: "uint256", name: "amountMinimum", type: "uint256" },
      { internalType: "address", name: "recipient", type: "address" },
    ],
    name: "sweepToken",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [],
    name: "symbol",
    outputs: [{ internalType: "string", name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "index", type: "uint256" }],
    name: "tokenByIndex",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "owner", type: "address" },
      { internalType: "uint256", name: "index", type: "uint256" },
    ],
    name: "tokenOfOwnerByIndex",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "tokenId", type: "uint256" }],
    name: "tokenURI",
    outputs: [{ internalType: "string", name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "totalSupply",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "from", type: "address" },
      { internalType: "address", name: "to", type: "address" },
      { internalType: "uint256", name: "tokenId", type: "uint256" },
    ],
    name: "transferFrom",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "amount0Owed", type: "uint256" },
      { internalType: "uint256", name: "amount1Owed", type: "uint256" },
      { internalType: "bytes", name: "data", type: "bytes" },
    ],
    name: "uniswapV3MintCallback",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "amountMinimum", type: "uint256" },
      { internalType: "address", name: "recipient", type: "address" },
    ],
    name: "unwrapWETH9",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  { stateMutability: "payable", type: "receive" },
];
async function main() {
  const getProvider = new ethers.providers.AlchemyProvider(
    "goerli",
    "QW4G2ZMha8yvoWFOWIhbHZHRCQDioUe7"
  );
  const impersonatedSigner = await ethers.getImpersonatedSigner(
    "0xF977814e90dA44bFA03b6295A0616a897441aceC"
  );

  const connectedWallet = new ethers.Wallet(
    "b1eee4fb8a77198bb60c87db8600a3e36ef28aa863a614d3da7e135e2a5926c9",
    getProvider
  );

  let rangeLow = 169_685_000;
  let rangeHigh = 170_706_000;
  let lastUSDCLiquidity = 49999999999996455;
  let lastWethLiquidity = 2241265516074;
  // usdc Contract
  const usdc = new ethers.Contract(
    "0xD87Ba7A50B2E7E660f678A895E4B72E7CB4CCd9C",
    abi,
    getProvider
  );

  // weth Contract
  const weth = new ethers.Contract(
    "0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6",
    abi,
    getProvider
  );
  //usdc Token Object
  const usdcToken = new Token(
    ChainId.GÖRLI,
    "0xD87Ba7A50B2E7E660f678A895E4B72E7CB4CCd9C",
    6,
    "USDC",
    "USD Coin"
  );

  //weth Token Object
  const wethToken = new Token(
    ChainId.GÖRLI,
    "0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6",
    18,
    "WETH",
    "Wrapped Ether"
  );

  // computing the pool address

  const currentPoolAddress = computePoolAddress({
    factoryAddress: "0x1F98431c8aD98523631AE4a59f267346ea31F984",
    tokenA: usdcToken,
    tokenB: wethToken,
    fee: 3000,
  });
  console.log(currentPoolAddress);

  // Pool Contract Initiating
  const poolContract = new ethers.Contract(
    currentPoolAddress,
    IUniswapV3PoolABI.abi,
    getProvider
  );
  // getting Pool info
  const [token0, token1, fee, tickSpacing, liquidity, slot0] =
    await Promise.all([
      poolContract.token0(),
      poolContract.token1(),
      poolContract.fee(),
      poolContract.tickSpacing(),
      poolContract.liquidity(),
      poolContract.slot0(),
    ]);
  console.log(token0, token1, fee, tickSpacing, liquidity, slot0[0], slot0[1]);

  const router = new AlphaRouter({
    chainId: ChainId.GÖRLI,
    provider: getProvider,
  });

  const options2 = {
    recipient: connectedWallet.address,
    slippageTolerance: new Percent(500, 10_000),
    deadline: Math.floor(Date.now() / 1000 + 1800),
    type: SwapType.SWAP_ROUTER_02,
  };

  async function swapUSDC(amount) {
    const route = await router.route(
      CurrencyAmount.fromRawAmount(usdcToken, amount),
      wethToken,
      TradeType.EXACT_INPUT,
      options2
    );

    const wethAmount = ethers.utils.parseUnits(route.quote.toFixed(10), "18");
    console.log(wethAmount);
    console.log(await weth.balanceOf(connectedWallet.address));
    console.log(await usdc.balanceOf(connectedWallet.address));
    await usdc
      .connect(connectedWallet)
      .approve("0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45", amount);
    console.log("starting");

    console.log("interval started");
    console.log("sending tx");
    const res = connectedWallet.sendTransaction({
      data: route.methodParameters.calldata,
      to: "0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45",
      value: BigNumber.from(route.methodParameters.value),
      from: connectedWallet.address,
      maxFeePerGas: 39526680449,
      maxPriorityFeePerGas: 30526680449,
      gasLimit: ethers.utils.hexlify(1000000),
    });
    console.log("waiting for tx..");
    await res.wait();
    console.log(res);
    console.log("waiting for balances...");
  }
  async function swapWeth(amount) {
    const route = await router.route(
      CurrencyAmount.fromRawAmount(wethToken, amount),
      usdcToken,
      TradeType.EXACT_INPUT,
      options2
    );

    const usdcAmount = ethers.utils.parseUnits(route.quote.toFixed(10), "18");
    console.log(usdcAmount);
    console.log(await weth.balanceOf(connectedWallet.address));
    console.log(await usdc.balanceOf(connectedWallet.address));
    await weth
      .connect(connectedWallet)
      .approve("0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45", amount);
    console.log("starting");

    console.log("interval started");
    console.log("sending tx");
    const res = connectedWallet.sendTransaction({
      data: route.methodParameters.calldata,
      to: "0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45",
      value: BigNumber.from(route.methodParameters.value),
      from: impersonatedSigner.address,
      maxFeePerGas: 39526680449,
      maxPriorityFeePerGas: 30526680449,
      gasLimit: ethers.utils.hexlify(1000000),
    });
    console.log("waiting for tx..");
    await res.wait();
    console.log(res);
    console.log("waiting for balances...");
  }

  function tickToPriceInUSDC(tick) {
    const sqrtRatiox96 = TickMath.getSqrtRatioAtTick(tick);
    const ratioX192 = JSBI.multiply(sqrtRatiox96, sqrtRatiox96);
    const baseAmount = JSBI.BigInt(1 * 10 ** 6);
    const shift = JSBI.leftShift(JSBI.BigInt(1), JSBI.BigInt(192));
    const quoteAmount = FullMath.mulDivRoundingUp(ratioX192, baseAmount, shift);
    console.log(10 ** 18 / quoteAmount.toString());
    return 10 ** 18 / quoteAmount.toString();
  }

  function priceToTick(price) {
    const quoteAmount = 10 ** 18 / price;
    const shift = JSBI.leftShift(JSBI.BigInt(1), JSBI.BigInt(192));
    const baseAmount = JSBI.BigInt(1 * 10 ** 6);
    const ratioX192 = FullMath.mulDivRoundingUp(
      JSBI.BigInt(Math.round(quoteAmount)),
      shift,
      baseAmount
    );
    console.log(
      TickMath.getTickAtSqrtRatio(
        JSBI.BigInt(Math.round(Math.sqrt(ratioX192.toString())))
      )
    );
    return TickMath.getTickAtSqrtRatio(
      JSBI.BigInt(Math.round(Math.sqrt(ratioX192.toString())))
    );
  }

  //Initializing Pool
  const pool = new Pool(
    wethToken,
    usdcToken,
    fee,
    slot0[0].toString(),
    liquidity.toString(),
    slot0[1]
  );
  console.log(
    nearestUsableTick(
      priceToTick(tickToPriceInUSDC(slot0[1]) + 25),
      tickSpacing
    )
  );
  const nonfungiblePositionManagerContract = new ethers.Contract(
    NONFUNGIBLE_POSITION_MANAGER_ADDRESS,
    nfpmAbi,
    getProvider
  );

  function rebalance(newPrice) {
    usdcAmount = lastUSDCLiquidity;
    wethAmount = lastWethLiquidity;
    if (usdcAmount / wethAmount != newPrice) {
      if (usdcAmount / wethAmount > newPrice) {
        let x = usdcAmount - newPrice * wethAmount;
        //swap half x
        swapUSDC(x / 2);
        return;
      } else {
        let x = wethAmount - usdcAmount / newPrice;
        swapWeth(x / 2);
        return;
      }
    }
  }
  let tokenIdOfTheLastPosition = 59763;

  // creating liquidity
  async function createLiquidity(usdcAmount, wethAmount, newPrice) {
    lastUSDCLiquidity = await usdc.balanceOf(connectedWallet.address);
    lastWethLiquidity = await weth.balanceOf(connectedWallet.address);
    usdcAmount = lastUSDCLiquidity / 1e6;
    usdcAmount = lastWethLiquidity / 1e18;
    console.log(
      ethers.utils.parseUnits(usdcAmount, "6").toString(),
      ethers.utils.parseUnits(wethAmount, "18").toString(),
      ethers.utils
        .parseUnits((Number(usdcAmount) * 0.95).toString(), "6")
        .toString(),
      ethers.utils
        .parseUnits((Number(wethAmount) * 0.95).toString(), "18")
        .toString()
    );
    console.log("___getting balances___");
    console.log(await weth.balanceOf(connectedWallet.address));
    console.log(await usdc.balanceOf(connectedWallet.address));
    console.log("___approving usdc and weth___");
    await usdc
      .connect(connectedWallet)
      .approve(
        NONFUNGIBLE_POSITION_MANAGER_ADDRESS,
        ethers.utils.parseUnits(usdcAmount, "6")
      );
    await weth
      .connect(impersonatedSigner)
      .approve(
        NONFUNGIBLE_POSITION_MANAGER_ADDRESS,
        ethers.utils.parseUnits(wethAmount, "18")
      );
    console.log("getting positions");
    const position = Position.fromAmounts({
      pool: pool,
      tickLower: nearestUsableTick(priceToTick(newPrice + 25), tickSpacing),
      tickUpper: nearestUsableTick(priceToTick(newPrice - 25), tickSpacing),
      amount0: ethers.utils.parseUnits(usdcAmount, "6"),
      amount1: ethers.utils.parseUnits(wethAmount, "18"),
      useFullPrecision: false,
    });
    console.log("___getting options___");
    const mintOptions = {
      recipient: connectedWallet.address,
      deadline: Math.floor(Date.now() / 1000) + 60 * 20,
      slippageTolerance: new Percent(500, 10_000),
    };
    console.log("___adding parameters___");
    const { calldata, value } = NonfungiblePositionManager.addCallParameters(
      position,
      mintOptions
    );
    console.log("___making tx___");
    const mintTransaction = {
      data: calldata,
      to: NONFUNGIBLE_POSITION_MANAGER_ADDRESS,
      value: value,
      from: connectedWallet.address,
      maxFeePerGas: 3952668044090,
      maxPriorityFeePerGas: 3050206680449,
    };
    console.log("___sending tx___");
    const tx = await connectedWallet.sendTransaction(mintTransaction);
    let arr = await tx.wait();
    console.log("___Token ID of new position____");
    console.log(parseInt(arr.logs[3].topics[1]));
    tokenIdOfTheLastPosition = parseInt(arr.logs[3].topics[1]);
  }

  const filter = {
    topics: [
      ethers.utils.id(
        "Swap(address,address,int256,int256,uint160,uint128,int24)"
      ),
    ],
  };
  // async function collectFees(tokenId) {
  //   const positionState = await nonfungiblePositionManagerContract
  //     .connect(impersonatedSigner)
  //     .positions(tokenId);
  //   console.log(positionState.tickLower);
  //   console.log(positionState.tickUpper);
  //   console.log(positionState.liquidity.toString());
  //   console.log(positionState.tokensOwed0);
  //   console.log(positionState.tokensOwed1);

  //   await nonfungiblePositionManagerContract
  //     .connect(impersonatedSigner)
  //     .collect({
  //       tokenId: tokenId,
  //       recipient: impersonatedSigner.address,
  //       amount0Max: BigNumber.from("999999999999999999"),
  //       amount1Max: BigNumber.from("999999999999999999"),
  //     });
  // }

  async function removeLiq(liqToken0, liqToken1, positionId) {
    let position = await nonfungiblePositionManagerContract.positions(400000);
    const currentPosition = await constructPosition(
      CurrencyAmount.fromRawAmount(usdcToken, liqToken0),
      CurrencyAmount.fromRawAmount(wethToken, liqToken1)
    );
    const collectOptions = {
      expectedCurrencyOwed0: CurrencyAmount.fromRawAmount(
        usdcToken,
        position.tokensOwed0
      ),
      expectedCurrencyOwed1: CurrencyAmount.fromRawAmount(
        wethToken,
        position.tokensOwed1
      ),
      recipient: connectedWallet.address,
    };
    const removeLiquidityOptions = {
      deadline: Math.floor(Date.now() / 1000 + 60 * 20),
      slippageTolerance: new Percent(50, 10_000),
      tokenId: positionId,
      // percentage of liquidity to remove
      liquidityPercentage: new Percent(100, 100),
      collectOptions,
    };

    const { calldata, value } = NonfungiblePositionManager.removeCallParameters(
      currentPosition,
      removeLiquidityOptions
    );

    const transaction = {
      data: calldata,
      to: NONFUNGIBLE_POSITION_MANAGER_ADDRESS,
      value: value,
      from: connectedWallet.address,
      maxFeePerGas: 3952668044090,
      maxPriorityFeePerGas: 3852668044090,
    };
    await connectedWallet.sendTransaction(transaction);
    return new Promise((resolve, reject) => {
      resolve();
    });
  }

  console.log(
    await nonfungiblePositionManagerContract.positions(tokenIdOfTheLastPosition)
  );

  poolContract.on("Swap", (...args) => {
    let newPrice = tickToPriceInUSDC(args[6]);
    console.log("Swap tracked, the new price is: ", newPrice);
    if (newPrice > rangeHigh || newPrice < rangeLow) {
      //remove liquidity and collect fees
      removeLiq(
        lastUSDCLiquidity,
        lastWethLiquidity,
        tokenIdOfTheLastPosition
      ).then(rebalance(newPrice));

      createLiquidity(newPrice);
      //   //then add new liquidity with new range
      //   //save all the necessary information for extracting the position again
      // }
      //else keep going with the current liquidity
    }
  });
}

main();
