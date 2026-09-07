import { useId } from 'react'
import { SPECIES } from '../game/data'
import type { SpeciesId } from '../game/types'

function Face({ x = 100, y = 96, spread = 19, happy = false }: { x?: number; y?: number; spread?: number; happy?: boolean }) {
  return <g stroke="#27453d" strokeWidth="3.2" strokeLinecap="round" fill="#27453d">
    <g className="creature-eyes">
      {happy ? <><path d={`M${x - spread - 4} ${y + 1}q4-7 8 0M${x + spread - 4} ${y + 1}q4-7 8 0`} fill="none" /></> : <>
        <ellipse cx={x - spread} cy={y} rx="4" ry="5.5" /><ellipse cx={x + spread} cy={y} rx="4" ry="5.5" />
        <circle cx={x - spread + 1} cy={y - 2} r="1.5" fill="white" stroke="none" /><circle cx={x + spread + 1} cy={y - 2} r="1.5" fill="white" stroke="none" />
      </>}
    </g>
    <path d={`M${x - 5} ${y + 13}q5 6 10 0`} fill="none" strokeWidth="2.4" />
    <ellipse cx={x - spread - 8} cy={y + 10} rx="7" ry="3.5" fill="#e69583" stroke="none" opacity=".48" />
    <ellipse cx={x + spread + 8} cy={y + 10} rx="7" ry="3.5" fill="#e69583" stroke="none" opacity=".48" />
  </g>
}

export function CreatureArt({ species: id, luminous = false, className = '', decorative = false, happy = false }: {
  species: SpeciesId
  luminous?: boolean
  className?: string
  decorative?: boolean
  happy?: boolean
}) {
  const species = SPECIES[id]
  const uniqueId = useId().replace(/:/g, '')
  const fill = luminous ? '#e0c5ed' : species.color
  const accent = luminous ? '#8c79b8' : species.accent
  const ink = '#355247'
  const evolved = ['briarhorn', 'cinderlynx', 'tidewhisk', 'cairnback', 'plumesail', 'lumimoth'].includes(id)
  const shape = (() => {
    switch (species.shape) {
      case 'fox':
        return <>
          <path d="M130 129c26 0 45-18 43-43-19 7-18 24-39 19" fill={accent} />
          <path d="M163 94q4-10 10-8 1 14-8 23l-7-8Z" fill="#f0e7b9" stroke="none" />
          <ellipse cx="100" cy="128" rx="38" ry="29" fill={fill} />
          <path d="M66 87C47 72 47 42 58 31c18 4 29 24 29 40M115 70c1-24 18-40 31-39 10 20 7 42-11 56" fill={fill} />
          <path d="m62 46 13 26-16-9m72 10 9-26-2 22" fill={accent} stroke="none" />
          <path d="M53 99c1-32 27-46 49-43 27-3 49 17 49 43 0 31-31 43-49 42-25 1-50-15-49-42Z" fill={fill} />
          <path d="M61 111q40 19 80 0c-6 22-26 29-39 28-18 1-34-10-41-28Z" fill="#f0edc9" stroke="none" />
          <path d="M77 61q-5-25 16-40 14 22 0 40m8-2q4-21 24-20-1 21-20 27" fill={accent} strokeWidth="2.5" />
          <ellipse cx="80" cy="150" rx="13" ry="7" fill={fill} /><ellipse cx="121" cy="150" rx="13" ry="7" fill={fill} />
          <Face x={101} y={94} happy={happy} />
        </>
      case 'cub':
        return <>
          <path d="M133 127q38 5 31-25" fill="none" stroke={accent} strokeWidth="13" />
          <path d="M161 111c-20-12-4-22-2-36 5 12 21 17 12 33Z" fill="#f5cd78" />
          <ellipse cx="98" cy="129" rx="39" ry="28" fill={fill} />
          <circle cx="64" cy="61" r="20" fill={fill} /><circle cx="135" cy="61" r="20" fill={fill} />
          <circle cx="64" cy="61" r="11" fill={accent} stroke="none" /><circle cx="135" cy="61" r="11" fill={accent} stroke="none" />
          <path d="M52 99c0-30 16-47 47-47s49 17 49 47c0 31-20 42-49 42-28 0-47-13-47-42Z" fill={fill} />
          <path d="M88 57C76 42 91 27 93 15c16 15 28 25 17 45" fill="#f5cd78" />
          <ellipse cx="99" cy="117" rx="21" ry="15" fill="#f4d9ae" stroke="none" />
          <ellipse cx="77" cy="152" rx="14" ry="8" fill={accent} /><ellipse cx="122" cy="152" rx="14" ry="8" fill={accent} />
          <path d="m66 78 6 6m57-6-6 6" fill="none" stroke={accent} strokeWidth="5" />
          <Face y={97} happy={happy} />
        </>
      case 'otter':
        return <>
          <path d="M130 125c36-8 35-34 48-39 10 21-4 52-43 55" fill={accent} />
          <ellipse cx="98" cy="127" rx="37" ry="30" fill={fill} />
          <path d="M62 83Q35 71 46 54q20 0 33 13m43-1q16-17 32-13 5 23-19 33" fill={accent} />
          <ellipse cx="99" cy="95" rx="47" ry="41" fill={fill} />
          <path d="M70 111c4-21 14-9 29-11 14 2 26-10 30 11-1 15-15 25-30 25-17 0-30-11-29-25Z" fill="#e3efe3" stroke="none" />
          <path d="M89 51q4-24 18-25-7 13 6 27" fill={accent} />
          <path d="m49 106 27 3m-26 9 23-2m77-10-28 3m28 9-24-2" stroke={accent} strokeWidth="2.5" />
          <ellipse cx="76" cy="153" rx="17" ry="7" fill={accent} /><ellipse cx="120" cy="153" rx="17" ry="7" fill={accent} />
          {evolved && <path d="M62 127q38 24 77-1" fill="none" stroke="#e7dfb2" strokeWidth="8" />}
          <Face y={93} happy={happy} />
        </>
      case 'deer':
        return <>
          <ellipse cx="100" cy="129" rx="33" ry="23" fill={fill} />
          <path d="m76 140-2 20h12l4-19m22 0 4 19h12l-3-20" fill={fill} />
          <path d="M77 62 61 32l1-16m4 26-16-7m73 27 16-30-1-16m-4 26 16-7" fill="none" stroke={accent} strokeWidth="8" />
          <path d="M66 79Q35 76 44 55q21-1 34 18m43 0q13-18 35-18 8 21-23 24" fill={fill} />
          <path d="M61 92c0-28 20-39 39-39s39 11 39 39c0 28-24 48-39 48S61 120 61 92Z" fill={fill} />
          <path d="m100 64 13 20-13 11-13-11Z" fill={accent} stroke="none" />
          <ellipse cx="100" cy="120" rx="19" ry="12" fill="#ece5c8" stroke="none" />
          <Face y={100} spread={18} happy={happy} />
        </>
      case 'turtle':
        return <>
          <ellipse cx="73" cy="147" rx="20" ry="9" fill={fill} /><ellipse cx="134" cy="147" rx="20" ry="9" fill={fill} />
          <path d="M40 132c-4-57 23-85 68-85 41 0 61 27 54 85Z" fill={accent} />
          <path d="m107 48-18 34 22 30 31-19-13-40m-40 29-46 12m68 18 6 20" fill="none" opacity=".45" />
          {evolved && <><path d="m79 52 3-20 28-4 22 10-4 17Z" fill={fill} /><path d="m90 31 3-17 19-4 12 18Z" fill={accent} /></>}
          <ellipse cx="67" cy="122" rx="30" ry="29" fill={fill} />
          <Face x={65} y={117} spread={12} happy={happy} />
          <path d="M126 59q8-22 20-17-1 17-20 17" fill="#80a369" />
        </>
      case 'bird':
        return <>
          <path d="M65 119q-39-9-33-43 25 0 47 29m49 11q29-33 47-22-5 29-39 35" fill={accent} />
          <path d="m82 143-6 13m0 0h-9m45-13 7 13m0 0h9" fill="none" stroke="#bd8a50" strokeWidth="5" />
          <path d="M54 107c0-41 21-66 47-64 28 0 48 23 48 64s-27 44-48 44-47-6-47-44Z" fill={fill} />
          <ellipse cx="101" cy="123" rx="29" ry="22" fill="#f2ead2" stroke="none" />
          <path d="M88 46q-11-22 1-29 5 10 10 23 7-27 18-25 1 20-9 31" fill={accent} />
          <Face y={97} spread={19} happy={happy} />
          <path d="m94 110 7 9 9-9-9-5Z" fill="#d5a252" strokeWidth="2" />
          {evolved && <path d="M46 99Q4 68 16 43q9 11 27 20M147 106q39-24 38-46-24 8-34 25" fill={accent} />}
        </>
      case 'worm':
        return <>
          <circle cx="149" cy="128" r="20" fill={accent} /><circle cx="120" cy="130" r="23" fill={fill} />
          <circle cx="89" cy="125" r="26" fill={fill} />
          <path d="M56 84q-12-25-3-37m29 30q12-26 26-24" fill="none" strokeWidth="4" />
          <circle cx="52" cy="45" r="7" fill={accent} /><circle cx="109" cy="51" r="7" fill={accent} />
          <circle cx="67" cy="105" r="35" fill={fill} />
          <ellipse cx="66" cy="127" rx="21" ry="10" fill="#eee6af" stroke="none" />
          <circle cx="151" cy="124" r="9" fill="#fff5c2" stroke="none" />
          <Face x={66} y={99} spread={13} happy={happy} />
          <path d="M68 142v8m29-6v9m28-7v6" strokeWidth="5" />
        </>
      case 'moth':
        return <>
          <path d="M94 96C54 15 13 27 23 71c-18 24 12 58 66 43-49 3-44 49-16 39 24-7 26-26 27-35" fill={fill} />
          <path d="M106 96c40-81 81-69 71-25 18 24-12 58-66 43 49 3 44 49 16 39-24-7-26-26-27-35" fill={fill} />
          <path d="M81 83Q36 32 43 65q-6 29 41 31m35-13q45-51 38-18 6 29-41 31M77 123l-9 14m55-14 9 14" fill={accent} stroke="none" />
          <path d="m89 67-9-32m31 32 9-32" fill="none" />
          <circle cx="80" cy="34" r="5" fill={accent} /><circle cx="120" cy="34" r="5" fill={accent} />
          <ellipse cx="100" cy="114" rx="14" ry="32" fill={accent} />
          <circle cx="100" cy="81" r="24" fill="#ece7c8" />
          <Face x={100} y={79} spread={10} happy={happy} />
        </>
      case 'mushroom':
        return <>
          <path d="M68 95c6 17 0 36-6 46-9 18 77 18 72 0-7-14-11-27-8-46" fill={fill} />
          <path d="M26 93c1-35 33-65 72-65 38 0 68 26 75 65-24 18-118 23-147 0Z" fill={accent} />
          <ellipse cx="71" cy="54" rx="13" ry="9" fill="#f6e2b8" stroke="none" transform="rotate(-30 71 54)" />
          <ellipse cx="124" cy="54" rx="10" ry="8" fill="#f6e2b8" stroke="none" transform="rotate(25 124 54)" />
          <ellipse cx="145" cy="84" rx="12" ry="7" fill="#f6e2b8" stroke="none" />
          <ellipse cx="93" cy="81" rx="16" ry="10" fill="#f6e2b8" stroke="none" />
          <Face x={99} y={123} spread={17} happy={happy} />
          <path d="m60 150-13 5m89-5 13 5" fill="none" stroke={accent} strokeWidth="7" />
        </>
      case 'ghost':
        return <>
          <path d="M65 126c-25-11-26-29-17-29l17 8m70 21c25-11 26-29 17-29l-17 8" fill={fill} />
          <path d="M55 117c-12-46 30-50 30-93 41 13 65 57 65 86 0 31-22 47-41 39-10 12-14 15-23 1-22 8-37-11-31-33Z" fill={fill} />
          <path d="M82 64q15-24 3-40 30 11 39 38" fill={accent} stroke="none" opacity=".65" />
          <ellipse cx="103" cy="124" rx="24" ry="18" fill="#f3e9d7" stroke="none" opacity=".65" />
          <Face x={102} y={101} spread={18} happy={happy} />
        </>
      case 'snail':
        return <>
          <circle cx="122" cy="92" r="48" fill={accent} />
          <path d="M122 127c-42-2-45-57-7-59 28-3 36 35 9 36-15 0-17-17-5-18" fill="none" stroke={fill} strokeWidth="6" />
          <path d="M42 116C35 83 72 78 78 113l4 17c43 3 71-1 83 11 12 18-57 16-88 13-24-2-41-14-35-38Z" fill={fill} />
          <path d="m49 98-9-27m28 22 6-28" fill="none" strokeWidth="4" />
          <circle cx="39" cy="67" r="6" fill={fill} /><circle cx="74" cy="62" r="6" fill={fill} />
          <Face x={60} y={111} spread={10} happy={happy} />
        </>
      case 'golem':
        return <>
          <path d="m52 96-21 9 2 34 25-2m86-41 25 9-3 34-25-2" fill={accent} />
          <path d="m61 126 1 29 29 4 4-29m18 1 2 28 29-4-2-28" fill={fill} />
          <path d="m68 49 62-4 24 36-13 56-75 3-16-60Z" fill={fill} />
          <path d="m83 48 12-22 22 4 9 16" fill={accent} />
          <path d="m54 87 19 7-6 46m81-58-19 13 12 42M95 120l11 3 8-5" fill="none" opacity=".5" />
          <Face y={91} spread={20} happy={happy} />
          <path d="m81 62 9 10m27-13-8 12" stroke={accent} strokeWidth="7" />
        </>
      case 'fish':
        return <>
          <path d="M133 98q39-39 44-21l-3 19 8 28q-12 13-48-11" fill={accent} />
          <path d="M86 74c-15-42 35-54 40-18 1 17-24 20-24 4 1-9 12-9 12-3" fill={accent} />
          <path d="M88 127q-15 35 19 28c25-8 14-29-1-20" fill={accent} />
          <ellipse cx="95" cy="103" rx="53" ry="34" fill={fill} />
          <path d="m100 92-17 18 19 12 10-16Z" fill={accent} />
          <Face x={63} y={99} spread={10} happy={happy} />
          <circle cx="151" cy="55" r="5" fill="#f4dfab" stroke="none" /><circle cx="165" cy="43" r="3" fill="#f4dfab" stroke="none" />
        </>
      case 'lizard':
        return <>
          <path d="M125 127c63 8 38-48 46-62 10 41-5 48-29 38" fill={fill} />
          <ellipse cx="99" cy="127" rx="39" ry="23" fill={fill} />
          <path d="m88 118-6 37H62m56-27 13 24h15" fill="none" stroke={accent} strokeWidth="9" />
          <path d="M51 98c-4-29 20-47 47-41 24 5 36 25 29 48-5 15-24 29-48 23-21-5-30-10-28-30Z" fill={fill} />
          <path d="m69 60 3-21 18 20 13-14 8 23" fill={accent} />
          <Face x={85} y={94} spread={17} happy={happy} />
          <path d="m133 102 9-12 9 10m-1-9 9-12 8 8" fill={accent} />
        </>
      case 'drop':
        return <>
          <path d="M100 24c-6 28-56 41-57 80-2 34 22 48 57 48 39 0 63-22 57-51-7-34-55-51-57-77Z" fill={fill} />
          <path d="M69 89c0-16 15-24 22-32" fill="none" stroke="#eef7e5" strokeWidth="9" />
          <path d="M49 121q48 30 101-1c-3 26-20 33-51 33-30 0-45-9-50-32Z" fill={accent} opacity=".45" stroke="none" />
          <Face y={111} spread={21} happy={happy} />
          <path d="M34 153q-15-15-5-22 9 5 5 22m130-7q17-7 18 2-7 6-18-2" fill={fill} />
        </>
      case 'owl':
        return <>
          <path d="M66 145v12m-7 1h16m49-13v12m-7 1h16" fill="none" stroke="#ba915b" strokeWidth="5" />
          <path d="M52 91 47 38l38 23q18-8 30 0l38-23-5 52c19 44-4 64-47 64-45 0-64-21-49-63Z" fill={fill} />
          <path d="M55 109q-31-6-27 20 26 14 40-1m77-19q31-6 27 20-26 14-40-1" fill={accent} />
          <path d="M99 79C65 50 39 94 68 122c19 17 26 7 33 4 12 9 26 9 41-8 21-27-9-66-43-39Z" fill={accent} stroke="none" />
          <Face x={100} y={98} spread={22} happy={happy} />
          <path d="m94 112 6 10 7-10-7-4Z" fill="#b88c57" strokeWidth="2" />
          <path d="m83 140 4 4m14-7 4 4m12-2 4 4" stroke={accent} strokeWidth="3" />
        </>
      case 'guardian':
        return <>
          <ellipse cx="100" cy="41" rx="47" ry="13" fill="none" stroke={accent} strokeWidth="4" opacity=".8" />
          <path d="M81 89C51 40 7 44 15 65l14 11-20 5 20 18-8 12c21 17 42 8 65-5m33-17c30-49 74-45 66-24l-14 11 20 5-20 18 8 12c-21 17-42 8-65-5" fill={accent} />
          <path d="M65 67q-12-35 4-43l20 40m21 0 20-40q16 8 4 43" fill={fill} />
          <path d="M66 91c-1-28 16-43 34-43 24 0 42 29 33 51l-14 28-19 30-21-32Z" fill={fill} />
          <path d="m100 61 9 14-9 15-9-15Z" fill="#fff5d3" stroke="none" />
          <path d="m77 133-12 28m56-28 13 28m-34-4v12" fill="none" stroke={accent} strokeWidth="5" />
          <Face x={100} y={103} spread={16} happy={happy} />
          <path d="m29 131 3 7 8 2-8 3-3 7-3-7-7-3 7-2Zm142-4 2 6 7 2-7 3-2 6-3-6-6-3 6-2Z" fill="#f0cf79" stroke="none" />
        </>
    }
  })()
  return <svg className={`creature-art ${className} ${luminous ? 'luminous' : ''}`} viewBox="0 0 200 180" role={decorative ? undefined : 'img'} aria-hidden={decorative || undefined} aria-labelledby={decorative ? undefined : `${uniqueId}-title`}>
    {!decorative && <title id={`${uniqueId}-title`}>{luminous ? 'Luminous ' : ''}{species.name}</title>}
    <ellipse cx="102" cy="160" rx={species.shape === 'guardian' ? 54 : 46} ry="8" fill="#244c3d" opacity=".12" />
    <g className="creature-body" stroke={ink} strokeWidth="2.8" strokeLinejoin="round" strokeLinecap="round">{shape}</g>
    {luminous && <g className="luminous-sparkles" fill="#b987ce"><path d="m28 40 3 9 9 3-9 3-3 9-3-9-9-3 9-3ZM167 22l2 7 7 2-7 2-2 7-2-7-7-2 7-2Z" /><circle cx="167" cy="140" r="3" /></g>}
  </svg>
}
