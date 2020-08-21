import * as NodeClam from 'clamscan';
import { ScanService, ScanProps } from '.';

interface ClamScan {
  is_infected: (file: string) => Promise<{
    is_infected: boolean, 
    file: string, 
    viruses: string[]
  }>
}

export const createClamScan = ({
  rootStoragePath,
  host,
  port
}: ScanProps) => {

  const scanPromise: Promise<ClamScan> = new NodeClam().init({
    clamdscan: {
      socket: false,
      host,
      port,
      timeout: 300000
    }
  });

  const service: ScanService = {
    scan: (file) => scanPromise.then((clamscan) => 
      clamscan.is_infected(file.getFilePath(rootStoragePath))
    ).then((scan) => 
      ({
        scanned: true,
        infected: scan.is_infected
      })
    )
  }

  return service;
}
