import React, { useEffect, useState } from 'react'
import { Form, Grid } from 'semantic-ui-react'

import { useSubstrate } from './substrate-lib'
import { TxButton } from './substrate-lib/components'

import KittyCards from './KittyCards'

export default function Kitties (props) {
  const { api, keyring } = useSubstrate()
  const { accountPair } = props

  const [kitties, setKitties] = useState([])
  const [status, setStatus] = useState('')

  const [kittyDNAs, setKittyDNAs] = useState([]);
  const [kittyOwners, setKittyOwners] = useState([]);
  const fetchKitties = () => {
    // TODO: 在这里调用 `api.query.kittiesModule.*` 函数去取得猫咪的信息。
    // 你需要取得：
    
    let unsubscribe;
    //   - 共有多少只猫咪
    api.query.kittiesModule.kittiesCount(cnt => {
      if (cnt != ''){
        console.log("kitties count: "+ cnt);
        const kitty_ids = Array.from(Array(parseInt(cnt, 10)), (v, k) => k);
        //   - 每只猫咪的主人是谁
        api.query.kittiesModule.owner.multi(kitty_ids, kitty_owners => {
          console.log("owner:", kitty_owners);
          setKittyOwners(kitty_owners);
        })
        .catch(console.error);
        //   - 每只猫咪的 DNA 是什么，用来组合出它的形态
        api.query.kittiesModule.kitties.multi(kitty_ids, kitty_dna => {
          console.log("kitties_dna:", kitty_dna);
          setKittyDNAs(kitty_dna);
        })
        .catch(console.error);
      }
    }).then(unsub => {
      unsubscribe = unsub;
    })
    .catch(console.error);

    return () => unsubscribe && unsubscribe();
  }

  const populateKitties = () => {
    // TODO: 在这里添加额外的逻辑。你需要组成这样的数组结构：
    //  ```javascript
    //  const kitties = [{
    //    id: 0,
    //    dna: ...,
    //    owner: ...
    //  }, { id: ..., dna: ..., owner: ... }]
    //  ```
    // 这个 kitties 会传入 <KittyCards/> 然后对每只猫咪进行处理

    let kitties = [];
    for (let i = 0; i < kittyDNAs.length; ++i)  {
      let temp = {};
      temp.id = i;
      temp.dna = kittyDNAs[i].unwrap();
      temp.owner = keyring.encodeAddress(kittyOwners[i].unwrap());
      console.log(temp)

      kitties[i] = temp;
    }
    setKitties(kitties)
    console.log("kitties" , kitties)
  }

  useEffect(fetchKitties, [api, keyring])
  useEffect(populateKitties, [kittyDNAs, kittyOwners])

  return <Grid.Column width={16}>
    <h1>小毛孩</h1>
    <KittyCards kitties={kitties} accountPair={accountPair} setStatus={setStatus} />
    <Form style={{ margin: '1em 0' }}>
      <Form.Field style={{ textAlign: 'center' }}>
        <TxButton
          accountPair={accountPair} label='创建小毛孩' type='SIGNED-TX' setStatus={setStatus}
          attrs={{
            palletRpc: 'kittiesModule',
            callable: 'create',
            inputParams: [],
            paramFields: []
          }}
        />
      </Form.Field>
    </Form>
    <div style={{ overflowWrap: 'break-word' }}>{status}</div>
  </Grid.Column>
}
