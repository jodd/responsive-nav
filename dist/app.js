import $ from 'jquery';
import {Nav} from '../src/responsive-nav.js';

$(document).ready(function() {
    var nav = new Nav($('nav')[0]);
});