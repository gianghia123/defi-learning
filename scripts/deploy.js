import { buildModule } from "@nomicfoundation/hardhat-ignition/modules"

export default buildModule("HustTokenModule", (m) => {
  const token = m.contract("HustToken");

  return { token };
})
