/**
 * Cargo Mobile V1 - Authoritative Rwanda Administrative Areas (Provinces, Districts, Sectors)
 * Comprehensive dataset covering all 30 official districts of Rwanda.
 */

export interface RwandaDistrictData {
  district: string;
  province: string;
  sectors: string[];
}

export const RWANDA_LOCATION_DATA: RwandaDistrictData[] = [
  // Kigali City (3 Districts)
  {
    district: 'Gasabo',
    province: 'Kigali City',
    sectors: ['Kimironko', 'Kacyiru', 'Gisozi', 'Remera', 'Bumbogo', 'Jabana', 'Ndera', 'Rutunga', 'Rusororo'],
  },
  {
    district: 'Kicukiro',
    province: 'Kigali City',
    sectors: ['Niboye', 'Kagarama', 'Gikondo', 'Kanombe', 'Masaka', 'Gahanga', 'Gatenga', 'Kicukiro', 'Nyarugunga'],
  },
  {
    district: 'Nyarugenge',
    province: 'Kigali City',
    sectors: ['Nyarugenge', 'Nyamirambo', 'Kimisagara', 'Mageragere', 'Rwezamenyo', 'Gitega', 'Kanyinya', 'Kigali', 'Muhima'],
  },

  // Eastern Province (7 Districts)
  {
    district: 'Nyagatare',
    province: 'Eastern',
    sectors: ['Karangazi', 'Nyagatare', 'Katabagemu', 'Rukomo', 'Matimba', 'Rwempasha', 'Mimuri', 'Mukama', 'Musheli'],
  },
  {
    district: 'Gatsibo',
    province: 'Eastern',
    sectors: ['Kabarore', 'Kiziguro', 'Kiramuruzi', 'Ngarama', 'Rugarama', 'Gasange', 'Gatsibo', 'Gitoki', 'Kageyo'],
  },
  {
    district: 'Bugesera',
    province: 'Eastern',
    sectors: ['Nyamata', 'Rilima', 'Mayange', 'Ngeruka', 'Mareba', 'Gashora', 'Juru', 'Kamabuye', 'Musenyi'],
  },
  {
    district: 'Kirehe',
    province: 'Eastern',
    sectors: ['Kirehe', 'Gahara', 'Kigarama', 'Mahama', 'Musaza', 'Gatore', 'Kigina', 'Nasho', 'Nyamugari'],
  },
  {
    district: 'Ngoma',
    province: 'Eastern',
    sectors: ['Kibungo', 'Kazo', 'Mugesera', 'Rukira', 'Sake', 'Zaza', 'Gashanda', 'Jarama', 'Karembo'],
  },
  {
    district: 'Rwamagana',
    province: 'Eastern',
    sectors: ['Kigabiro', 'Muhazi', 'Nzige', 'Mwulire', 'Fumbwe', 'Gahengeri', 'Gishari', 'Karenge', 'Musha'],
  },
  {
    district: 'Kayonza',
    province: 'Eastern',
    sectors: ['Mukarange', 'Kabare', 'Mwiri', 'Ruramira', 'Ndego', 'Gahini', 'Murama', 'Murundi', 'Rukara'],
  },

  // Northern Province (5 Districts)
  {
    district: 'Musanze',
    province: 'Northern',
    sectors: ['Muhoza', 'Cyuve', 'Kinigi', 'Busogo', 'Remera', 'Gacaca', 'Gashaki', 'Gataraga', 'Kimonyi'],
  },
  {
    district: 'Gicumbi',
    province: 'Northern',
    sectors: ['Byumba', 'Kaniga', 'Miyove', 'Manyagiro', 'Rukomo', 'Bukamba', 'Bwisige', 'Kageyo', 'Mukarange'],
  },
  {
    district: 'Burera',
    province: 'Northern',
    sectors: ['Ruhunde', 'Rugarama', 'Bungwe', 'Cyanika', 'Nemba', 'Butaro', 'Gahunga', 'Gatebe', 'Gitovu'],
  },
  {
    district: 'Rulindo',
    province: 'Northern',
    sectors: ['Tare', 'Base', 'Burega', 'Bushoki', 'Buyoga', 'Cyinzuzi', 'Cyungo', 'Kinihira', 'Kisaro'],
  },
  {
    district: 'Gakenke',
    province: 'Northern',
    sectors: ['Gakenke', 'Busengo', 'Coko', 'Cyabingo', 'Gashyushya', 'Janja', 'Kamubuga', 'Karambo', 'Kivuruga'],
  },

  // Southern Province (8 Districts)
  {
    district: 'Huye',
    province: 'Southern',
    sectors: ['Ngoma', 'Tumba', 'Mukura', 'Mbazi', 'Huye', 'Rwaniro', 'Gishamvu', 'Karama', 'Kigoma'],
  },
  {
    district: 'Muhanga',
    province: 'Southern',
    sectors: ['Nyamabuye', 'Cyeza', 'Shyogwe', 'Muhanga', 'Kabacuzi', 'Kibangu', 'Kiyumba', 'Mushishiro', 'Nyabinoni'],
  },
  {
    district: 'Nyanza',
    province: 'Southern',
    sectors: ['Busasamana', 'Mukingo', 'Kibirizi', 'Ntyazo', 'Nyagisozi', 'Busoro', 'Cyabakamyi', 'Kigoma', 'Muyira'],
  },
  {
    district: 'Gisagara',
    province: 'Southern',
    sectors: ['Ndora', 'Gikonko', 'Gishamvu', 'Kansi', 'Kibilizi', 'Muganza', 'Mukindo', 'Mamba', 'Save'],
  },
  {
    district: 'Kamonyi',
    province: 'Southern',
    sectors: ['Gacurabwenge', 'Karama', 'Kayenzi', 'Kayumbu', 'Mugina', 'Musambira', 'Ngamba', 'Nyamiyaga', 'Runda'],
  },
  {
    district: 'Ruhango',
    province: 'Southern',
    sectors: ['Ruhango', 'Bweramana', 'Byimana', 'Kabagari', 'Kinazi', 'Kinihira', 'Mbuye', 'Mwendo', 'Ntongwe'],
  },
  {
    district: 'Nyamagabe',
    province: 'Southern',
    sectors: ['Gasaka', 'Buruhukiro', 'Cyanika', 'Gatare', 'Kaduha', 'Kamegeli', 'Kibirizi', 'Kibumbwe', 'Kitabi'],
  },
  {
    district: 'Nyaruguru',
    province: 'Southern',
    sectors: ['Kibeho', 'Busanze', 'Cyahinda', 'Mata', 'Munini', 'Ngera', 'Ngoma', 'Nyabimata', 'Nyagisozi'],
  },

  // Western Province (7 Districts)
  {
    district: 'Rubavu',
    province: 'Western',
    sectors: ['Gisenyi', 'Rugerero', 'Rubavu', 'Kanama', 'Nyamyumba', 'Bugeshi', 'Busasamana', 'Cyanzarwe', 'Mudende'],
  },
  {
    district: 'Rusizi',
    province: 'Western',
    sectors: ['Kamembe', 'Gihundwe', 'Mururu', 'Bugarama', 'Nyakabuye', 'Giheke', 'Gashonga', 'Nkanka', 'Nkombo'],
  },
  {
    district: 'Karongi',
    province: 'Western',
    sectors: ['Rubengera', 'Bwishyura', 'Gashari', 'Gishyita', 'Gisovu', 'Mubuga', 'Murambi', 'Murundi', 'Mutuntu'],
  },
  {
    district: 'Rutsiro',
    province: 'Western',
    sectors: ['Gihango', 'Boneza', 'Kigeyo', 'Kivumu', 'Manihira', 'Mukura', 'Murunda', 'Musasa', 'Rusebeya'],
  },
  {
    district: 'Nyabihu',
    province: 'Western',
    sectors: ['Mukamira', 'Bigogwe', 'Jenda', 'Jomba', 'Kaborondo', 'Karago', 'Kintobo', 'Rambura', 'Rurembo'],
  },
  {
    district: 'Nyamasheke',
    province: 'Western',
    sectors: ['Kagano', 'Bushekeri', 'Bushenge', 'Cyato', 'Gihombo', 'Kanjongo', 'Karambi', 'Karengera', 'Kirimbi'],
  },
  {
    district: 'Ngororero',
    province: 'Western',
    sectors: ['Ngororero', 'Bwira', 'Gatumba', 'Hindiro', 'Kabaya', 'Kageyo', 'Kavumu', 'Matyazo', 'Muhanda'],
  },
];

export const RWANDA_DISTRICTS = RWANDA_LOCATION_DATA.map(d => d.district);

export function getSectorsForDistrict(districtName: string): string[] {
  const matched = RWANDA_LOCATION_DATA.find(
    d => d.district.toLowerCase() === districtName.trim().toLowerCase()
  );
  return matched ? matched.sectors : ['Central Sector'];
}
