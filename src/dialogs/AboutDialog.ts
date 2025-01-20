/**
 * MCell, Mirek's Cellebration - https://mcell.ca
 * Copyright (c) Mirek Wojtowicz. All rights reserved.
 * Licensed under MIT License with Attribution Requirement (see README.md)
 */

// AboutDialog.js
import { Constants } from '../utils/Constants.js';
import { Dialog } from './Dialog.js';

export class AboutDialog extends Dialog {
  constructor() {
    super();
  }

  show() {
    const content = `
          <div class="about-dialog">
            <div class="about-header">
              <h1><img src="assets/mcell-icon.png" alt="MCell Icon" width="24" height="24"/>&nbsp;Mirek's Cellebration</h1>
            </div>
            <div class="about-content">
              <p>MCell is a Web-based Cellular Automata explorer allowing to view, animate, create and study
              hundreds of Cellular Automata rules and patterns from many Cellular Automata families.</p>
              
              <div class="about-info">
                <p><strong>Author:</strong> Mirek Wojtowicz</p>
                <p><strong>Contact:</strong> <a href="mailto:info@mcell.ca">info@mcell.ca</a><br/>
                <strong>Website:</strong> <a href="https://mcell.ca" target="_blank">https://mcell.ca</a><br/>
                <strong>Discord:</strong> <a href="https://discord.gg/FhagUkEz" target="_blank">https://discord.gg/FhagUkEz</a><br/>
                <strong>Github:</strong> <a href="https://github.com/MiDevel/mcell-webapp" target="_blank">https://github.com/MiDevel/mcell-webapp</a></p>
              </div>

              <div class="about-license">
                <h3>License</h3>
                <p>MIT License with Attribution Requirement</p>
                <p>Copyright (c) 1999..2025 Mirek Wojtowicz</p>
                <p>This software is open source and freely available for use and modification under the MIT License 
                with Attribution Requirement. Any use of this software must include visible attribution to 
                Mirek Wojtowicz and a link to https://mcell.ca</p>
                <p>Full license text can be found in the <a href="https://github.com/MiDevel/mcell-webapp/blob/main/LICENSE" target="_blank">LICENSE</a> file.</p>
              </div>

              <div class="about-acknowledgments">
                <h3>Acknowledgments</h3>
                <div class="scrollable-content">
                  <p>I would like to express my sincere gratitude to the many individuals who have contributed to making MCell possible:</p>
                  <ul>
                    <li>Prof. David Griffeath, The Primordial Soup Kitchen author, for comments, encouragement and the "MCell" (Mirek's Cellebration) name idea</li>
                    <li>Stephen Wolfram, for kind mentioning MCell and its author in the book "A New Kind of Science"</li>
                    <li>Prof. Rudy Rucker, author of CelLab (https://www.fourmilab.ch/cellab/), for his invaluable contributions to the field of Cellular Automata and his comments and suggestions</li>
                    <li>Johan Bontes, author of Life32, for insights into Cellular Automata coding</li>
                    <li>James Matthews, webmaster for Generation5.org, for his helpful comments, reviews and suggestions</li>
                    <li>John Elliott, author of Webside CA Java applet, for endless discussions and invaluable suggestions</li>
                    <li>Michael Sweney and Lionel Bonnetier, authors of many "Generations" rules and patterns</li>
                    <li>Dr Dana Eckart, Paul Callahan, Alan Hensel, Ken S. Mueller, Ed Pegg Jr, David Ingalls Bell (https://members.canb.auug.org.au/~dbell/), for words of encouragement and suggestions</li>
                    <li>Ben Schaeffer, author of LifeMN and many Weighted Life rules</li>
                    <li>Stephen Silver, author of Life Lexicon and of many StarWars rule patterns</li>
                    <li>Prof. Tomoaki Suzudo, author of CA applets and many Neumann binary rules and patterns</li>
                    <li>Jason Summers, author of Life patterns, for many Life and Weighted Life patterns</li>
                    <li>Jason Rampe, author of "Visions Of Chaos" and "Tiled CA", for many unique patterns in various rules</li>
                    <li>Brian Prentice, for many interesting patterns in several rules</li>
                    <li>And many others...</li>
                  </ul>
                  <p>This list represents just a few of the many individuals who have contributed to the project. Thank you, guys!</p>
                </div>
              </div>
            </div>
          </div>
        `;

    super.show(`MCell for Web v.${Constants.VERSION}`, content);
  }
}

export const aboutDialog = new AboutDialog();
