import { activeDirectoryFindNew } from "./active_directory_part";

export async function startInterval () {
    setInterval(async () => { // Here you can configure interval between requests to MS Graph
        await activeDirectoryFindNew();
    }, 1000 * 60 * 60 * Number(process.env.ACTIVE_DIRECTORY_INTERVAL));
};

startInterval()