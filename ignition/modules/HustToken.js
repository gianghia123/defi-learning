import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("HustTokenModule", (m) => {
    const contract = m.contract("HustToken");

    return { contract };
});
