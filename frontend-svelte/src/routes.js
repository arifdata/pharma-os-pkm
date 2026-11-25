// Route Dashboard
import HomePage from './routes/HomePage.svelte'
import TestingPage from './routes/TestingPage.svelte'

// Route Pendaftaran
import DataPasienPage from './routes/pendaftaran/DataPasienPage.svelte'
import DataPeresepPage from './routes/pendaftaran/DataPeresepPage.svelte'
// import PasienDetailPage from './routes/pendaftaran/PasienDetailPage.svelte'
// import TambahPasienPage from './routes/pendaftaran/TambahPasienPage.svelte'

// Route Farmasi
import MasterBMHPPage from './routes/farmasi/master_bmhp/MasterBMHPPage.svelte'
import PenerimaanGudangPage from './routes/farmasi/penerimaan_gudang/PenerimaanGudangPage.svelte'
import DetailPenerimaanGudangPage from './routes/farmasi/penerimaan_gudang/DetailPenerimaanGudangPage.svelte'
import StokGudangPage from './routes/farmasi/StokGudangPage.svelte'
import DistribusiGudangPage from './routes/farmasi/distribusi_gudang/DistribusiGudangPage.svelte'
import BukuPenerimaan from './routes/farmasi/penerimaan_gudang/BukuPenerimaan.svelte'
import SubunitPage from './routes/farmasi/subunit/SubunitPage.svelte'

// Example routes
// import Name from './routes/Name.svelte'
// import Wild from './routes/Wild.svelte'
// import NotFound from './routes/NotFound.svelte'

// Export the route definition object
export default {
    // Exact path
    '/': HomePage,
    '/testing': TestingPage,

    '/penerimaan_gudang': PenerimaanGudangPage,
    '/penerimaan_gudang/add': BukuPenerimaan,
    '/penerimaan_gudang/:id': DetailPenerimaanGudangPage,
    '/stok_gudang': StokGudangPage,
    '/distribusi_gudang': DistribusiGudangPage,
    '/masterbmhp': MasterBMHPPage,
    '/subunit': SubunitPage,

    '/data_pasien': DataPasienPage,
    '/data_peresep': DataPeresepPage,
    // '/data_pasien/detail/:id': PasienDetailPage,
    // '/data_pasien/tambah': TambahPasienPage,

    // '/farmasi/master_bmhp': MasterBMHP,
    // '/farmasi/master_bmhp/detail/:id': DetailMasterBMHP,

    // Using named parameters, with last being optional
    // '/hello/:first/:last?': Name,

    // Wildcard parameter
    // Included twice to match both `/wild` (and nothing after) and `/wild/*` (with anything after)
    // '/wild': Wild,
    // '/wild/*': Wild,

    // Catch-all, must be last
    // '*': NotFound,
}
