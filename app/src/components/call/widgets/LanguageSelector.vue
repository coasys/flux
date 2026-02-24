<template>
  <select
    :value="modelValue"
    @change="$emit('update:modelValue', ($event.target as HTMLSelectElement).value)"
    aria-label="Transcription language"
    style="background: var(--j-color-ui-100); color: var(--j-color-ui-800); border: 1px solid var(--j-color-ui-300); border-radius: 4px; padding: 2px 6px; font-size: 12px;"
  >
    <optgroup label="Common">
      <option value="en">English</option>
      <option value="zh">Chinese</option>
      <option value="es">Spanish</option>
      <option value="fr">French</option>
      <option value="de">German</option>
      <option value="pt">Portuguese</option>
      <option value="ja">Japanese</option>
      <option value="ko">Korean</option>
      <option value="ru">Russian</option>
      <option value="ar">Arabic</option>
      <option value="hi">Hindi</option>
      <option value="it">Italian</option>
      <option value="nl">Dutch</option>
      <option value="tr">Turkish</option>
      <option value="pl">Polish</option>
      <option value="sv">Swedish</option>
    </optgroup>
    <optgroup label="European">
      <option value="bg">Bulgarian</option>
      <option value="bs">Bosnian</option>
      <option value="ca">Catalan</option>
      <option value="hr">Croatian</option>
      <option value="cs">Czech</option>
      <option value="da">Danish</option>
      <option value="et">Estonian</option>
      <option value="fi">Finnish</option>
      <option value="gl">Galician</option>
      <option value="el">Greek</option>
      <option value="hu">Hungarian</option>
      <option value="is">Icelandic</option>
      <option value="lv">Latvian</option>
      <option value="lt">Lithuanian</option>
      <option value="lb">Luxembourgish</option>
      <option value="mk">Macedonian</option>
      <option value="mt">Maltese</option>
      <option value="no">Norwegian</option>
      <option value="nn">Nynorsk</option>
      <option value="ro">Romanian</option>
      <option value="sr">Serbian</option>
      <option value="sk">Slovak</option>
      <option value="sl">Slovenian</option>
      <option value="uk">Ukrainian</option>
      <option value="cy">Welsh</option>
    </optgroup>
    <optgroup label="Asian">
      <option value="az">Azerbaijani</option>
      <option value="bn">Bengali</option>
      <option value="gu">Gujarati</option>
      <option value="id">Indonesian</option>
      <option value="jw">Javanese</option>
      <option value="kn">Kannada</option>
      <option value="kk">Kazakh</option>
      <option value="km">Khmer</option>
      <option value="lo">Lao</option>
      <option value="ms">Malay</option>
      <option value="ml">Malayalam</option>
      <option value="mn">Mongolian</option>
      <option value="my">Myanmar</option>
      <option value="ne">Nepali</option>
      <option value="pa">Punjabi</option>
      <option value="fa">Persian</option>
      <option value="si">Sinhala</option>
      <option value="su">Sundanese</option>
      <option value="tl">Tagalog</option>
      <option value="ta">Tamil</option>
      <option value="tt">Tatar</option>
      <option value="te">Telugu</option>
      <option value="th">Thai</option>
      <option value="bo">Tibetan</option>
      <option value="ur">Urdu</option>
      <option value="uz">Uzbek</option>
      <option value="vi">Vietnamese</option>
    </optgroup>
    <optgroup label="African">
      <option value="af">Afrikaans</option>
      <option value="am">Amharic</option>
      <option value="ha">Hausa</option>
      <option value="ln">Lingala</option>
      <option value="mg">Malagasy</option>
      <option value="sn">Shona</option>
      <option value="so">Somali</option>
      <option value="sw">Swahili</option>
      <option value="yo">Yoruba</option>
    </optgroup>
    <optgroup label="Other">
      <option value="sq">Albanian</option>
      <option value="hy">Armenian</option>
      <option value="as">Assamese</option>
      <option value="ba">Bashkir</option>
      <option value="eu">Basque</option>
      <option value="be">Belarusian</option>
      <option value="br">Breton</option>
      <option value="fo">Faroese</option>
      <option value="ka">Georgian</option>
      <option value="ht">Haitian Creole</option>
      <option value="haw">Hawaiian</option>
      <option value="he">Hebrew</option>
      <option value="la">Latin</option>
      <option value="mi">Maori</option>
      <option value="mr">Marathi</option>
      <option value="oc">Occitan</option>
      <option value="ps">Pashto</option>
      <option value="sa">Sanskrit</option>
      <option value="sd">Sindhi</option>
      <option value="tg">Tajik</option>
      <option value="tk">Turkmen</option>
      <option value="yi">Yiddish</option>
    </optgroup>
  </select>
</template>

<script setup lang="ts">
defineProps<{ modelValue: string }>();
defineEmits<{ 'update:modelValue': [value: string] }>();
</script>
